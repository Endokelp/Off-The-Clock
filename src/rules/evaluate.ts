import {
  breakLimits,
  citations,
  hourLimits,
  minimumWage2026,
  overtimePremiumMultiplier,
  overtimeThresholdHours,
  type Citation,
  type WorkerBand,
} from './law.ts';

export type Shift = {
  id: string;
  employer: string;
  // Calendar day the shift started, YYYY-MM-DD.
  date: string;
  // Minutes after midnight on that day. A shift ending after midnight has an end past 1440.
  startMinutes: number;
  endMinutes: number;
  // The uninterrupted meal break actually received, which is what the statute measures.
  mealBreakMinutes: number;
  // Rest breaks of at least 10 minutes actually received.
  restBreaksTaken: number;
  // Minutes the employer subtracted from the paycheck for breaks.
  unpaidBreakMinutes: number;
};

export type Profile = {
  birthDate: string;
  hourlyWage: number;
  // 0 is Sunday. Default is Monday through Friday.
  schoolWeekdays: number[];
  schoolYearStart: string;
  schoolYearEnd: string;
};

export type ViolationCode =
  | 'daily-hours'
  | 'weekly-hours'
  | 'days-per-week'
  | 'started-too-early'
  | 'ended-too-late'
  | 'missed-meal-break'
  | 'missed-rest-break'
  | 'docked-for-time-worked'
  | 'below-minimum-wage'
  | 'unpaid-overtime';

export type Violation = {
  code: ViolationCode;
  // A week level violation has no single shift, so this is the first shift of that week.
  shiftId: string;
  date: string;
  headline: string;
  detail: string;
  citation: Citation;
  owedCents: number;
};

export type WeekSummary = {
  weekStart: string;
  isSchoolWeek: boolean;
  minutesWorked: number;
  daysWorked: number;
  shiftIds: string[];
};

export type Assessment = {
  violations: Violation[];
  weeks: WeekSummary[];
  minutesWorked: number;
  unpaidMinutes: number;
  owedCents: number;
};

const minutesPerDay = 1440;

const parseDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (isoDate: string, count: number) => {
  const shifted = parseDate(isoDate);
  shifted.setUTCDate(shifted.getUTCDate() + count);
  return formatDate(shifted);
};

const weekdayOf = (isoDate: string) => parseDate(isoDate).getUTCDay();

// Washington does not define the week in WAC 296-125-101, so the app uses the ordinary
// Sunday through Saturday workweek that the wage statutes assume.
export const weekStartOf = (isoDate: string) => addDays(isoDate, -weekdayOf(isoDate));

export const ageOn = (birthDate: string, isoDate: string) => {
  const born = parseDate(birthDate);
  const on = parseDate(isoDate);
  let age = on.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < born.getUTCMonth() ||
    (on.getUTCMonth() === born.getUTCMonth() && on.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

export const ageBandOn = (profile: Profile, isoDate: string): WorkerBand => {
  const age = ageOn(profile.birthDate, isoDate);
  if (age >= 18) return 'adult';
  return age < 16 ? 'under16' : 'teen';
};

// ponytail: one contiguous school year plus a weekday set, rather than a real district
// calendar. Winter and spring break read as school weeks until the user corrects the dates.
export const isSchoolDay = (profile: Profile, isoDate: string) =>
  isoDate >= profile.schoolYearStart &&
  isoDate <= profile.schoolYearEnd &&
  profile.schoolWeekdays.includes(weekdayOf(isoDate));

const isSchoolWeek = (profile: Profile, weekStart: string) =>
  Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset)).some((day) =>
    isSchoolDay(profile, day),
  );

export const minutesWorkedIn = (shift: Shift) =>
  Math.max(0, shift.endMinutes - shift.startMinutes - shift.mealBreakMinutes);

const wageCentsOf = (profile: Profile) => Math.round(profile.hourlyWage * 100);

const centsForMinutes = (minutes: number, wageCents: number) =>
  Math.round((minutes * wageCents) / 60);

const formatClock = (minutes: number) => {
  const wrapped = ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const suffix = hour < 12 ? 'am' : 'pm';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, '0')}${suffix}`;
};

export const formatHours = (minutes: number) => {
  const whole = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (whole === 0) return `${rest}m`;
  return rest === 0 ? `${whole}h` : `${whole}h ${rest}m`;
};

const requiredRestBreaks = (minutesWorked: number, band: WorkerBand) => {
  const limits = breakLimits[band];
  if (minutesWorked < limits.restBreakThresholdMinutes) return 0;
  return Math.max(0, Math.ceil(minutesWorked / limits.maxMinutesBeforeRest) - 1);
};

const evaluateShift = (shift: Shift, profile: Profile, schoolWeek: boolean): Violation[] => {
  const band = ageBandOn(profile, shift.date);
  const limits = breakLimits[band];
  const wageCents = wageCentsOf(profile);
  const worked = minutesWorkedIn(shift);
  const gotMeal = shift.mealBreakMinutes >= limits.requiredMealMinutes;
  const found: Violation[] = [];

  const base = { shiftId: shift.id, date: shift.date };

  // The employer deducted more break time than the worker actually got off the clock, so the
  // difference is time worked and not paid for.
  const dockedMinutes = Math.max(0, shift.unpaidBreakMinutes - shift.mealBreakMinutes);
  if (dockedMinutes > 0) {
    found.push({
      ...base,
      code: 'docked-for-time-worked',
      headline: `Docked ${dockedMinutes} minutes you worked`,
      detail:
        `Your pay was cut by ${shift.unpaidBreakMinutes} minutes for a break, but the log ` +
        `shows you got ${shift.mealBreakMinutes} minutes away from work.`,
      citation: limits.mealCitation,
      owedCents: centsForMinutes(dockedMinutes, wageCents),
    });
  }

  if (worked > limits.maxMinutesBeforeMeal && !gotMeal) {
    found.push({
      ...base,
      code: 'missed-meal-break',
      headline: 'No meal break on a shift long enough to require one',
      detail:
        `You worked ${formatHours(worked)}. Your limit is ` +
        `${formatHours(limits.maxMinutesBeforeMeal)} without an uninterrupted ` +
        `${limits.requiredMealMinutes} minute meal break.`,
      citation: limits.mealCitation,
      owedCents: 0,
    });
  }

  // Under 16 a meal break also satisfies the two hour rule, which is why it counts here.
  const owedRest = requiredRestBreaks(worked, band);
  const breaksReceived = shift.restBreaksTaken + (band === 'under16' && gotMeal ? 1 : 0);
  const missedRest = Math.max(0, owedRest - breaksReceived);
  if (missedRest > 0) {
    found.push({
      ...base,
      code: 'missed-rest-break',
      headline: `${missedRest} paid rest ${missedRest === 1 ? 'break' : 'breaks'} you never got`,
      detail:
        `This ${formatHours(worked)} shift owes you ${owedRest} rest ` +
        `${owedRest === 1 ? 'break' : 'breaks'}. Rest breaks are on the employer clock, so ` +
        'working through them is unpaid work.',
      citation: limits.restCitation,
      owedCents: centsForMinutes(missedRest * limits.requiredRestMinutes, wageCents),
    });
  }

  if (band !== 'adult') {
    const hours = hourLimits[band][schoolWeek ? 'school' : 'nonschool'];
    const beforeSchoolDay = isSchoolDay(profile, addDays(shift.date, 1));
    const dailyCap =
      schoolWeek && isSchoolDay(profile, shift.date) && beforeSchoolDay
        ? hours.maxHoursSchoolDayBeforeSchoolDay
        : hours.maxHoursOtherDays;

    if (worked > dailyCap * 60) {
      found.push({
        ...base,
        code: 'daily-hours',
        headline: `${formatHours(worked)} on a day capped at ${dailyCap} hours`,
        detail: `You worked ${formatHours(worked - dailyCap * 60)} past the legal limit for this day.`,
        citation: hours.citation,
        owedCents: 0,
      });
    }

    if (shift.startMinutes < hours.earliestStartMinutes) {
      found.push({
        ...base,
        code: 'started-too-early',
        headline: `Started at ${formatClock(shift.startMinutes)}`,
        detail: `You cannot be scheduled before ${formatClock(hours.earliestStartMinutes)} in this week.`,
        citation: hours.citation,
        owedCents: 0,
      });
    }

    const latestEnd = beforeSchoolDay
      ? hours.latestEndBeforeSchoolDayMinutes
      : hours.latestEndOtherDaysMinutes;
    if (shift.endMinutes > latestEnd) {
      found.push({
        ...base,
        code: 'ended-too-late',
        headline: `Worked until ${formatClock(shift.endMinutes)}`,
        detail: `The latest you can work on this day is ${formatClock(latestEnd)}.`,
        citation: hours.citation,
        owedCents: 0,
      });
    }
  }

  return found;
};

// The wage floor is one fact about the job, not a fact about a shift, so the shortfall is summed
// across the whole log and reported once instead of repeating under every shift.
const evaluateWageFloor = (shifts: readonly Shift[], profile: Profile): Violation | null => {
  const wageCents = wageCentsOf(profile);
  if (wageCents <= 0) return null;

  let shortfallCents = 0;
  let shortfallMinutes = 0;
  let floorCents = 0;

  for (const shift of shifts) {
    const band = ageBandOn(profile, shift.date);
    const minimumCents = Math.round(
      (band === 'under16' ? minimumWage2026.under16 : minimumWage2026.adult) * 100,
    );
    if (wageCents >= minimumCents) continue;
    const paidMinutes = Math.max(
      0,
      shift.endMinutes - shift.startMinutes - shift.unpaidBreakMinutes,
    );
    shortfallCents += centsForMinutes(paidMinutes, minimumCents - wageCents);
    shortfallMinutes += paidMinutes;
    floorCents = Math.max(floorCents, minimumCents);
  }

  if (shortfallCents === 0) return null;

  const first = shifts.find((shift) => shift.date === shifts[0].date) ?? shifts[0];
  return {
    shiftId: first.id,
    date: first.date,
    code: 'below-minimum-wage',
    headline: `Paid below the $${(floorCents / 100).toFixed(2)} minimum`,
    detail:
      `Your rate is $${profile.hourlyWage.toFixed(2)} an hour. Washington sets the floor at ` +
      `$${(floorCents / 100).toFixed(2)} for your age in 2026, across ` +
      `${formatHours(shortfallMinutes)} of paid time in this log.`,
    citation: citations.minimumWage,
    owedCents: shortfallCents,
  };
};

const evaluateWeek = (
  week: WeekSummary,
  shiftsInWeek: Shift[],
  profile: Profile,
): Violation[] => {
  const band = ageBandOn(profile, week.weekStart);
  const wageCents = wageCentsOf(profile);
  const first = shiftsInWeek[0];
  const base = { shiftId: first.id, date: week.weekStart };
  const found: Violation[] = [];

  if (band !== 'adult') {
    const hours = hourLimits[band][week.isSchoolWeek ? 'school' : 'nonschool'];

    if (week.minutesWorked > hours.maxHoursPerWeek * 60) {
      found.push({
        ...base,
        code: 'weekly-hours',
        headline: `${formatHours(week.minutesWorked)} in a week capped at ${hours.maxHoursPerWeek} hours`,
        detail:
          `Week of ${week.weekStart}. You worked ` +
          `${formatHours(week.minutesWorked - hours.maxHoursPerWeek * 60)} past the limit.`,
        citation: hours.citation,
        owedCents: 0,
      });
    }

    if (week.daysWorked > hours.maxDaysPerWeek) {
      found.push({
        ...base,
        code: 'days-per-week',
        headline: `${week.daysWorked} days in one week`,
        detail: `Washington caps you at ${hours.maxDaysPerWeek} days in a week at your age.`,
        citation: hours.citation,
        owedCents: 0,
      });
    }
  }

  const overtimeMinutes = Math.max(0, week.minutesWorked - overtimeThresholdHours * 60);
  if (overtimeMinutes > 0 && wageCents > 0) {
    found.push({
      ...base,
      code: 'unpaid-overtime',
      headline: `${formatHours(overtimeMinutes)} of overtime`,
      detail:
        `Week of ${week.weekStart}. Hours past ${overtimeThresholdHours} in a week pay at one ` +
        'and a half times your rate, so half your rate on top is still owed if you were paid straight time.',
      citation: citations.overtime,
      owedCents: centsForMinutes(overtimeMinutes, Math.round(wageCents * overtimePremiumMultiplier)),
    });
  }

  return found;
};

export const assess = (shifts: readonly Shift[], profile: Profile): Assessment => {
  const byWeek = new Map<string, Shift[]>();
  for (const shift of [...shifts].sort((a, b) => a.date.localeCompare(b.date))) {
    const start = weekStartOf(shift.date);
    byWeek.set(start, [...(byWeek.get(start) ?? []), shift]);
  }

  const weeks: WeekSummary[] = [];
  const violations: Violation[] = [];

  for (const [weekStart, shiftsInWeek] of byWeek) {
    const schoolWeek = isSchoolWeek(profile, weekStart);
    const week: WeekSummary = {
      weekStart,
      isSchoolWeek: schoolWeek,
      minutesWorked: shiftsInWeek.reduce((total, shift) => total + minutesWorkedIn(shift), 0),
      daysWorked: new Set(shiftsInWeek.map((shift) => shift.date)).size,
      shiftIds: shiftsInWeek.map((shift) => shift.id),
    };
    weeks.push(week);

    for (const shift of shiftsInWeek) {
      violations.push(...evaluateShift(shift, profile, schoolWeek));
    }
    violations.push(...evaluateWeek(week, shiftsInWeek, profile));
  }

  const wageFloor = evaluateWageFloor(shifts, profile);
  if (wageFloor) violations.push(wageFloor);

  const unpaidMinutes = shifts.reduce(
    (total, shift) => total + Math.max(0, shift.unpaidBreakMinutes - shift.mealBreakMinutes),
    0,
  );

  return {
    violations,
    weeks,
    minutesWorked: weeks.reduce((total, week) => total + week.minutesWorked, 0),
    unpaidMinutes,
    owedCents: violations.reduce((total, violation) => total + violation.owedCents, 0),
  };
};

export const formatDollars = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
