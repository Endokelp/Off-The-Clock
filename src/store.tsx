import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Profile, Shift } from './rules/evaluate.ts';

const shiftsKey = 'off-the-clock/shifts';
const profileKey = 'off-the-clock/profile';

// A profile with no birth date has not been set up yet, which is how the home screen knows to
// send a first time user to settings before asking for a shift.
export const emptyProfile: Profile = {
  birthDate: '',
  hourlyWage: 0,
  schoolWeekdays: [1, 2, 3, 4, 5],
  schoolYearStart: '',
  schoolYearEnd: '',
};

export const isProfileComplete = (profile: Profile) =>
  profile.birthDate !== '' && profile.hourlyWage > 0;

// AsyncStorage hands back whatever was written last, including data from an older build, so
// everything read here is checked before it reaches the rules engine.
const readShifts = (raw: string | null): Shift[] => {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (entry): entry is Shift =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as Shift).id === 'string' &&
      typeof (entry as Shift).date === 'string' &&
      Number.isFinite((entry as Shift).startMinutes) &&
      Number.isFinite((entry as Shift).endMinutes),
  );
};

const readProfile = (raw: string | null): Profile => {
  if (!raw) return emptyProfile;
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return emptyProfile;
  const stored = parsed as Partial<Profile>;
  return {
    birthDate: typeof stored.birthDate === 'string' ? stored.birthDate : '',
    hourlyWage: Number.isFinite(stored.hourlyWage) ? Number(stored.hourlyWage) : 0,
    schoolWeekdays: Array.isArray(stored.schoolWeekdays)
      ? stored.schoolWeekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      : emptyProfile.schoolWeekdays,
    schoolYearStart: typeof stored.schoolYearStart === 'string' ? stored.schoolYearStart : '',
    schoolYearEnd: typeof stored.schoolYearEnd === 'string' ? stored.schoolYearEnd : '',
  };
};

type Store = {
  ready: boolean;
  shifts: Shift[];
  profile: Profile;
  saveShift: (shift: Shift) => void;
  removeShift: (id: string) => void;
  saveProfile: (profile: Profile) => void;
};

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  useEffect(() => {
    AsyncStorage.multiGet([shiftsKey, profileKey]).then((pairs) => {
      setShifts(readShifts(pairs[0][1]));
      setProfile(readProfile(pairs[1][1]));
      setReady(true);
    });
  }, []);

  const writeShifts = (next: Shift[]) => {
    setShifts(next);
    AsyncStorage.setItem(shiftsKey, JSON.stringify(next));
  };

  const store: Store = {
    ready,
    shifts,
    profile,
    saveShift: (shift) =>
      writeShifts(
        shifts.some((existing) => existing.id === shift.id)
          ? shifts.map((existing) => (existing.id === shift.id ? shift : existing))
          : [...shifts, shift],
      ),
    removeShift: (id) => writeShifts(shifts.filter((existing) => existing.id !== id)),
    saveProfile: (next) => {
      setProfile(next);
      AsyncStorage.setItem(profileKey, JSON.stringify(next));
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore was called outside StoreProvider');
  return store;
};
