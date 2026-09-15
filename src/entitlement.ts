// The purchase logic that does not need the SDK. Kept apart from purchases.tsx so the tests can
// run under node --test without loading react-native or the native purchase module.

// Must match the entitlement identifier configured in the RevenueCat dashboard. Everything the
// user pays for hangs off this one string, so it is written once and imported everywhere.
export const evidenceExportEntitlement = 'evidence_export';

export const appUserIdKey = 'off-the-clock/app-user-id';

// RevenueCat would assign an anonymous identifier on its own, but that one is not ours to put in
// a URL: it carries a dollar sign and a colon, and it is replaced when the app is reinstalled.
// A parent paying on the web has to land on the same customer the phone is reading, so the app
// mints an identifier it controls, keeps it, and hands the same string to both rails.
export const newAppUserId = () =>
  `otc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const isAppUserId = (value: unknown): value is string =>
  typeof value === 'string' && /^otc-[0-9a-z]+-[0-9a-z]+$/.test(value);

// Structural rather than imported from the SDK, which keeps this file free of native imports.
// A real CustomerInfo satisfies it.
type EntitlementHolder = { entitlements: { active: Record<string, unknown> } };

// RevenueCat only lists an entitlement under active while it is actually granted, so membership
// is the whole check. A purchase on either rail lands in the same map.
export const hasEvidenceExport = (customerInfo: EntitlementHolder) =>
  evidenceExportEntitlement in customerInfo.entitlements.active;

// The parent rail. RevenueCat takes the customer as a path segment rather than a query
// parameter, so the payment on the web attaches to the identifier the phone is already using.
// Without a token configured there is no link to send, and the caller hides the option.
export const webPurchaseLink = (token: string, appUserId: string) =>
  token === '' ? null : `https://pay.rev.cat/${token}/${appUserId}`;
