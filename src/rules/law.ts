// Washington minor employment law, chapter 296-125 WAC as amended by WSR 26-11-048,
// filed 5/19/26, effective 7/1/26. Every quote below was copied from the published text
// at app.leg.wa.gov. A citation that cannot be verified does not belong in this file.

export type Citation = {
  section: string;
  title: string;
  quote: string;
  url: string;
};

const wacUrl = (section: string) => `https://app.leg.wa.gov/WAC/default.aspx?cite=${section}`;
const rcwUrl = (section: string) => `https://app.leg.wa.gov/RCW/default.aspx?cite=${section}`;

export const citations = {
  hoursUnder16SchoolWeek: {
    section: 'WAC 296-125-101(1)(a)',
    title: 'Hours of work for minors',
    quote:
      'Minors under the age of 16 may work the following hours during school weeks: A maximum ' +
      'of three hours per day on any school day preceding another school day or otherwise a ' +
      'maximum of eight hours per day; a maximum of six days per week; a maximum of 16 hours ' +
      'per week; no earlier than 7:00 a.m.; no later than 7:00 p.m. on any day preceding a ' +
      'school day; no later than 9:00 p.m. on Fridays, Saturdays, and the day preceding a ' +
      'school holiday or vacation.',
    url: wacUrl('296-125-101'),
  },
  hoursUnder16NonschoolWeek: {
    section: 'WAC 296-125-101(1)(b)',
    title: 'Hours of work for minors',
    quote:
      'Minors under the age of 16 may work the following hours during nonschool weeks: A ' +
      'maximum of eight hours per day; a maximum of six days per week; a maximum of 40 hours ' +
      'per week; no earlier than 7:00 a.m.; and no later than 9:00 p.m.',
    url: wacUrl('296-125-101'),
  },
  hoursTeenSchoolWeek: {
    section: 'WAC 296-125-101(2)(a)',
    title: 'Hours of work for minors',
    quote:
      'Sixteen- and 17-year-old minors may work the following hours during school weeks: A ' +
      'maximum of four hours per day on any school day preceding another school day or ' +
      'otherwise a maximum of eight hours per day; a maximum of six days per week; a maximum ' +
      'of 20 hours per week; no earlier than 7:00 a.m.; no later than 10:00 p.m. on any day ' +
      'preceding a school day; no later than midnight on Fridays, Saturdays, and the day ' +
      'preceding a school holiday or vacation.',
    url: wacUrl('296-125-101'),
  },
  hoursTeenNonschoolWeek: {
    section: 'WAC 296-125-101(2)(b)',
    title: 'Hours of work for minors',
    quote:
      'Sixteen- and 17-year-old minors may work the following hours during nonschool weeks: ' +
      'Maximum of eight hours per day; maximum of six days per week; maximum of 48 hours per ' +
      'week; no earlier than 5:00 a.m.; and no later than 12:00 a.m.',
    url: wacUrl('296-125-101'),
  },
  mealUnder16: {
    section: 'WAC 296-125-111(1)',
    title: 'Meal and rest breaks, minors under the age of 16',
    quote:
      'Minors under the age of 16 must not work more than four consecutive hours without being ' +
      'given a meal break. Meal breaks must be uninterrupted and at least 30 minutes in ' +
      'length. Meal breaks must be separate and distinct from, and in addition to, the rest ' +
      'breaks mandated by this section.',
    url: wacUrl('296-125-111'),
  },
  restUnder16: {
    section: 'WAC 296-125-111(2) and (3)',
    title: 'Meal and rest breaks, minors under the age of 16',
    quote:
      'Rest breaks must be at least 10-minutes in length and be given on the business time. ' +
      'Minors under the age of 16 must not work more than two consecutive hours without ' +
      'receiving either a meal break or a rest break.',
    url: wacUrl('296-125-111'),
  },
  mealTeen: {
    section: 'WAC 296-125-121(1)',
    title: 'Meal and rest breaks, sixteen- and 17-year-old minors',
    quote:
      'Sixteen- and 17-year-old minors must not work more than five consecutive hours without ' +
      'receiving a meal break. Meal breaks must be uninterrupted and at least 30 minutes in ' +
      'length. Meal breaks must be separate and distinct from, and in addition to, the rest ' +
      'breaks mandated by this section.',
    url: wacUrl('296-125-121'),
  },
  restTeen: {
    section: 'WAC 296-125-121(2)',
    title: 'Meal and rest breaks, sixteen- and 17-year-old minors',
    quote:
      'When working four or more hours, 16- and 17-year-olds must receive a rest break at ' +
      'least 10-minutes in length. Rest breaks must be given on the business time. Sixteen- ' +
      'and 17-year-old minors must not work more than three hours without receiving a rest ' +
      'break.',
    url: wacUrl('296-125-121'),
  },
  mealAdult: {
    section: 'WAC 296-126-092(1) and (2)',
    title: 'Meal periods, rest periods',
    quote:
      'Employees shall be allowed a meal period of at least thirty minutes which commences no ' +
      'less than two hours nor more than five hours from the beginning of the shift. No employee ' +
      'shall be required to work more than five consecutive hours without a meal period.',
    url: wacUrl('296-126-092'),
  },
  restAdult: {
    section: 'WAC 296-126-092(4)',
    title: 'Meal periods, rest periods',
    quote:
      'Employees shall be allowed a rest period of not less than ten minutes, on the employer ' +
      'time, for each four hours of working time. Rest periods shall be scheduled as near as ' +
      'possible to the midpoint of the work period. No employee shall be required to work more ' +
      'than three hours without a rest period.',
    url: wacUrl('296-126-092'),
  },
  minimumWage: {
    section: 'WAC 296-125-081',
    title: 'Minimum wages, minors',
    quote:
      'Every employer shall pay to each of their employees who have reached their 16th or 17th ' +
      'year of age a rate of pay per hour which is equal to the hourly rate required by RCW ' +
      '49.46.020 for employees 18 years of age or older. Every employer shall pay to each of ' +
      'their employees who have not reached their 16th year of age a rate of pay per hour that ' +
      'is not less than 85 percent of the hourly rate required by RCW 49.46.020.',
    url: wacUrl('296-125-081'),
  },
  overtime: {
    section: 'RCW 49.46.130(1)',
    title: 'Minimum rate of compensation for employment in excess of forty hour workweek',
    quote:
      'No employer shall employ any of his or her employees for a workweek longer than forty ' +
      'hours unless such employee receives compensation for his or her employment in excess of ' +
      'the hours above specified at a rate not less than one and one-half times the regular ' +
      'rate at which he or she is employed.',
    url: rcwUrl('49.46.130'),
  },
} as const satisfies Record<string, Citation>;

// Announced by Labor and Industries for calendar year 2026. The rate for workers who have not
// turned 16 is 85 percent of the adult rate under WAC 296-125-081(2).
export const minimumWage2026 = { adult: 17.13, under16: 14.56 };

export const overtimeThresholdHours = 40;
export const overtimePremiumMultiplier = 0.5;

export type AgeBand = 'under16' | 'teen';

// The hour caps only reach minors, but the break rules reach everyone, so anyone who has turned
// 18 while logging shifts keeps getting checked against the adult sections.
export type WorkerBand = AgeBand | 'adult';

export type HourLimits = {
  maxHoursSchoolDayBeforeSchoolDay: number;
  maxHoursOtherDays: number;
  maxHoursPerWeek: number;
  maxDaysPerWeek: number;
  earliestStartMinutes: number;
  latestEndBeforeSchoolDayMinutes: number;
  latestEndOtherDaysMinutes: number;
  citation: Citation;
};

const hours = (count: number) => count * 60;

export const hourLimits: Record<AgeBand, Record<'school' | 'nonschool', HourLimits>> = {
  under16: {
    school: {
      maxHoursSchoolDayBeforeSchoolDay: 3,
      maxHoursOtherDays: 8,
      maxHoursPerWeek: 16,
      maxDaysPerWeek: 6,
      earliestStartMinutes: hours(7),
      latestEndBeforeSchoolDayMinutes: hours(19),
      latestEndOtherDaysMinutes: hours(21),
      citation: citations.hoursUnder16SchoolWeek,
    },
    nonschool: {
      maxHoursSchoolDayBeforeSchoolDay: 8,
      maxHoursOtherDays: 8,
      maxHoursPerWeek: 40,
      maxDaysPerWeek: 6,
      earliestStartMinutes: hours(7),
      latestEndBeforeSchoolDayMinutes: hours(21),
      latestEndOtherDaysMinutes: hours(21),
      citation: citations.hoursUnder16NonschoolWeek,
    },
  },
  teen: {
    school: {
      maxHoursSchoolDayBeforeSchoolDay: 4,
      maxHoursOtherDays: 8,
      maxHoursPerWeek: 20,
      maxDaysPerWeek: 6,
      earliestStartMinutes: hours(7),
      latestEndBeforeSchoolDayMinutes: hours(22),
      latestEndOtherDaysMinutes: hours(24),
      citation: citations.hoursTeenSchoolWeek,
    },
    nonschool: {
      maxHoursSchoolDayBeforeSchoolDay: 8,
      maxHoursOtherDays: 8,
      maxHoursPerWeek: 48,
      maxDaysPerWeek: 6,
      earliestStartMinutes: hours(5),
      latestEndBeforeSchoolDayMinutes: hours(24),
      latestEndOtherDaysMinutes: hours(24),
      citation: citations.hoursTeenNonschoolWeek,
    },
  },
};

export type BreakLimits = {
  maxMinutesBeforeMeal: number;
  requiredMealMinutes: number;
  maxMinutesBeforeRest: number;
  requiredRestMinutes: number;
  restBreakThresholdMinutes: number;
  mealCitation: Citation;
  restCitation: Citation;
};

export const breakLimits: Record<WorkerBand, BreakLimits> = {
  under16: {
    maxMinutesBeforeMeal: hours(4),
    requiredMealMinutes: 30,
    maxMinutesBeforeRest: hours(2),
    requiredRestMinutes: 10,
    // Under 16 there is no hours worked threshold before a rest break is owed. The two hour
    // rule in subsection (3) applies from the first minute, so a shift past two hours already
    // owes one. Sixteen and 17 year olds instead get a four hour threshold.
    restBreakThresholdMinutes: hours(2),
    mealCitation: citations.mealUnder16,
    restCitation: citations.restUnder16,
  },
  teen: {
    maxMinutesBeforeMeal: hours(5),
    requiredMealMinutes: 30,
    maxMinutesBeforeRest: hours(3),
    requiredRestMinutes: 10,
    restBreakThresholdMinutes: hours(4),
    mealCitation: citations.mealTeen,
    restCitation: citations.restTeen,
  },
  adult: {
    maxMinutesBeforeMeal: hours(5),
    requiredMealMinutes: 30,
    maxMinutesBeforeRest: hours(3),
    requiredRestMinutes: 10,
    restBreakThresholdMinutes: hours(4),
    mealCitation: citations.mealAdult,
    restCitation: citations.restAdult,
  },
};
