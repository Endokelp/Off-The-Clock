import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  appUserIdKey,
  hasEvidenceExport,
  isAppUserId,
  newAppUserId,
  webPurchaseLink,
} from './entitlement.ts';

// Public SDK keys are meant to ship inside the app, but they still differ per project and per
// build, so they are read from the environment rather than written into the file. Expo inlines
// anything prefixed EXPO_PUBLIC_ at build time.
const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';
const webToken = process.env.EXPO_PUBLIC_REVENUECAT_WEB_TOKEN ?? '';

type Purchase = {
  ready: boolean;
  // False when no key is configured. Logging and violation detection do not depend on this, so
  // the app runs and is useful with the purchase layer switched off entirely.
  configured: boolean;
  unlocked: boolean;
  price: string | null;
  parentLink: string | null;
  // Resolves to a message worth showing the user, or null when there is nothing to say, which
  // covers both a completed purchase and a cancelled one.
  buy: () => Promise<string | null>;
  refresh: () => Promise<string | null>;
};

// A rejected purchase carries userCancelled, but it arrives from native code and is only typed
// as unknown, so the shape is checked rather than asserted.
const isCancellation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { userCancelled?: unknown }).userCancelled === true;

const PurchaseContext = createContext<Purchase | null>(null);

const readAppUserId = async () => {
  const stored = await AsyncStorage.getItem(appUserIdKey);
  if (isAppUserId(stored)) return stored;
  const minted = newAppUserId();
  await AsyncStorage.setItem(appUserIdKey, minted);
  return minted;
};

export const PurchaseProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [offer, setOffer] = useState<PurchasesPackage | null>(null);
  const [appUserId, setAppUserId] = useState<string | null>(null);

  useEffect(() => {
    const onCustomerInfo = (customerInfo: CustomerInfo) =>
      setUnlocked(hasEvidenceExport(customerInfo));

    const start = async () => {
      const id = await readAppUserId();
      setAppUserId(id);

      if (apiKey === '') {
        setReady(true);
        return;
      }

      // The same identifier goes to the SDK and into the parent link, which is what lets a
      // payment made in a browser show up on this phone.
      Purchases.configure({ apiKey, appUserID: id });
      Purchases.addCustomerInfoUpdateListener(onCustomerInfo);

      try {
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        setUnlocked(hasEvidenceExport(customerInfo));
        setOffer(offerings.current?.availablePackages[0] ?? null);
      } catch {
        // Both calls reach the network. Leaving ready false here would hold the screen on a
        // spinner forever, so the screen opens with no price and the parent link still works.
      }
      setReady(true);
    };

    start();
    return () => {
      if (apiKey !== '') Purchases.removeCustomerInfoUpdateListener(onCustomerInfo);
    };
  }, []);

  const purchase: Purchase = {
    ready,
    configured: apiKey !== '',
    unlocked,
    price: offer?.product.priceString ?? null,
    parentLink: appUserId === null ? null : webPurchaseLink(webToken, appUserId),
    buy: async () => {
      if (offer === null) return 'The price did not load. Check your connection and try again.';
      try {
        const { customerInfo } = await Purchases.purchasePackage(offer);
        setUnlocked(hasEvidenceExport(customerInfo));
        return null;
      } catch (error) {
        // Backing out of the payment sheet arrives here as a thrown error even though nothing
        // went wrong, so it is the one case that reports nothing to the user.
        if (isCancellation(error)) return null;
        return 'The purchase did not go through. Nothing was charged.';
      }
    },
    // What the user taps after a parent has paid in a browser. The listener above covers the
    // case where the app was open at the time, this covers every other case.
    refresh: async () => {
      if (apiKey === '') return null;
      try {
        setUnlocked(hasEvidenceExport(await Purchases.getCustomerInfo()));
        return null;
      } catch {
        return 'Could not check just now. Try again once you have a connection.';
      }
    },
  };

  return <PurchaseContext.Provider value={purchase}>{children}</PurchaseContext.Provider>;
};

export const usePurchase = () => {
  const purchase = useContext(PurchaseContext);
  if (!purchase) throw new Error('usePurchase was called outside PurchaseProvider');
  return purchase;
};
