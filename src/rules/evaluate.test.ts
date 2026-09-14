import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ageOn,
  assess,
  formatDollars,
  minutesWorkedIn,
  weekStartOf,
  type Profile,
  type Shift,
  type ViolationCode,
} from './evaluate.ts';

// September 14 2026 is a Monday, July 13 2026 is a Monday in summer break.
const profile: Profile = {
  birthDate: '2009-03-02',
  hourlyWage: 17.13,
  schoolWeekdays: [1, 2, 3, 4, 5],
  schoolYearStart: '2026-09-02',
  schoolYearEnd: '2027-06-18',
};

const shift = (overrides: Partial<Shift> & Pick<Shift, 'id' | 'date'>): Shift => ({
  employer: 'Sandwich place',
  startMinutes: 16 * 60,
  endMinutes: 20 * 60,
  mealBreakMinutes: 0,
  restBreaksTaken: 0,
  unpaidBreakMinutes: 0,
  ...overrides,
});

const codes = (shifts: Shift[], who: Profile = profile): ViolationCode[] =>
  assess(shifts, who).violations.map((violation) => violation.code);

const owedFor = (shifts: Shift[], code: ViolationCode, who: Profile = profile) =>
  assess(shifts, who)
    .violations.filter((violation) => violation.code === code)
    .reduce((total, violation) => total + violation.owedCents, 0);

test('a week runs Sunday through Saturday', () => {
  assert.equal(weekStartOf('2026-09-14'), '2026-09-13');
  assert.equal(weekStartOf('2026-09-19'), '2026-09-13');
  assert.equal(weekStartOf('2026-09-13'), '2026-09-13');
});

test('age counts the day before a birthday as the younger age', () => {
  assert.equal(ageOn('2009-03-02', '2026-03-01'), 16);
  assert.equal(ageOn('2009-03-02', '2026-03-02'), 17);
});

test('time worked subtracts the meal break but not paid rest breaks', () => {
  const worked = minutesWorkedIn(
    shift({ id: 'a', date: '2026-07-13', startMinutes: 540, endMinutes: 1020, mealBreakMinutes: 30 }),
  );
  assert.equal(worked, 450);
});

test('break time deducted but never given is unpaid work', () => {
  // A 30 minute deduction with no break taken, at 17.13 an hour, is 8.565 dollars rounded up.
  const owed = owedFor(
    [shift({ id: 'a', date: '2026-07-13', startMinutes: 600, endMinutes: 840, unpaidBreakMinutes: 30 })],
    'docked-for-time-worked',
  );
  assert.equal(owed, 857);
  assert.equal(formatDollars(owed), '$8.57');
});

test('a deduction matching the break actually taken owes nothing', () => {
  const owed = owedFor(
    [
      shift({
        id: 'a',
        date: '2026-07-13',
        startMinutes: 600,
        endMinutes: 900,
        mealBreakMinutes: 30,
        unpaidBreakMinutes: 30,
      }),
    ],
    'docked-for-time-worked',
  );
  assert.equal(owed, 0);
});

test('an eight hour summer shift owes two rest breaks', () => {
  const summerShift = shift({
    id: 'a',
    date: '2026-07-13',
    startMinutes: 9 * 60,
    endMinutes: 17 * 60 + 30,
    mealBreakMinutes: 30,
  });
  const found = assess([summerShift], profile).violations;
  const rest = found.find((violation) => violation.code === 'missed-rest-break');
  assert.ok(rest, 'expected a missed rest break');
  // Two breaks of 10 minutes at 17.13 an hour is 5.71 dollars.
  assert.equal(rest.owedCents, 571);
  assert.equal(rest.citation.section, 'WAC 296-125-121(2)');
});

test('a three hour shift is under the rest break threshold for a 17 year old', () => {
  assert.ok(
    !codes([
      shift({ id: 'a', date: '2026-07-13', startMinutes: 13 * 60, endMinutes: 16 * 60 }),
    ]).includes('missed-rest-break'),
  );
});

test('a 15 year old owes a rest break after two hours', () => {
  const younger: Profile = { ...profile, birthDate: '2011-03-02', hourlyWage: 14.56 };
  const found = assess(
    [shift({ id: 'a', date: '2026-07-13', startMinutes: 13 * 60, endMinutes: 16 * 60 })],
    younger,
  ).violations;
  const rest = found.find((violation) => violation.code === 'missed-rest-break');
  assert.ok(rest, 'expected a missed rest break for a three hour shift under 16');
  assert.equal(rest.citation.section, 'WAC 296-125-111(2) and (3)');
});

test('a five hour school night shift breaks the four hour daily cap', () => {
  const found = codes([
    shift({ id: 'a', date: '2026-09-14', startMinutes: 16 * 60, endMinutes: 21 * 60 }),
  ]);
  assert.ok(found.includes('daily-hours'));
});

test('the same five hours on a Friday in the school year is legal', () => {
  const found = codes([
    shift({ id: 'a', date: '2026-09-18', startMinutes: 16 * 60, endMinutes: 21 * 60 }),
  ]);
  assert.ok(!found.includes('daily-hours'));
  assert.ok(!found.includes('ended-too-late'));
});

test('working past ten on a school night is flagged', () => {
  const found = codes([
    shift({ id: 'a', date: '2026-09-14', startMinutes: 19 * 60, endMinutes: 22 * 60 + 30 }),
  ]);
  assert.ok(found.includes('ended-too-late'));
});

test('a shift ending after midnight in summer is allowed for a 17 year old', () => {
  const found = codes([
    shift({ id: 'a', date: '2026-07-11', startMinutes: 18 * 60, endMinutes: 24 * 60 }),
  ]);
  assert.ok(!found.includes('ended-too-late'));
});

test('the twenty hour school week cap catches a heavy week', () => {
  const week = [1, 2, 3, 4].map((offset) =>
    shift({
      id: `s${offset}`,
      date: `2026-09-1${3 + offset}`,
      startMinutes: 15 * 60,
      endMinutes: 21 * 60,
    }),
  );
  const found = codes(week);
  assert.ok(found.includes('weekly-hours'));
});

test('pay below the 2026 minimum is priced at the shortfall', () => {
  const underpaid: Profile = { ...profile, hourlyWage: 16.0 };
  // Four paid hours short by 1.13 an hour is 4.52 dollars.
  const owed = owedFor(
    [shift({ id: 'a', date: '2026-07-13', startMinutes: 600, endMinutes: 840 })],
    'below-minimum-wage',
    underpaid,
  );
  assert.equal(owed, 452);
});

test('a 15 year old paid the adult floor is not flagged', () => {
  const younger: Profile = { ...profile, birthDate: '2011-03-02', hourlyWage: 14.56 };
  assert.ok(
    !codes([shift({ id: 'a', date: '2026-07-13', startMinutes: 600, endMinutes: 720 })], younger).includes(
      'below-minimum-wage',
    ),
  );
});

test('overtime past forty hours owes the half time premium', () => {
  const summerWeek = [0, 1, 2, 3, 4, 5].map((offset) =>
    shift({
      id: `s${offset}`,
      date: `2026-07-1${2 + offset}`,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
    }),
  );
  // Six eight hour days is 48 hours, so 8 hours of premium at half of 17.13.
  const owed = owedFor(summerWeek, 'unpaid-overtime');
  assert.equal(owed, Math.round(8 * 60 * Math.round(1713 * 0.5)) / 60);
  assert.equal(owed, 6856);
});

test('an empty log owes nothing and reports no violations', () => {
  const result = assess([], profile);
  assert.equal(result.owedCents, 0);
  assert.equal(result.violations.length, 0);
  assert.equal(result.weeks.length, 0);
});

test('every violation carries a citation with a section and a link', () => {
  const messy = [
    shift({
      id: 'a',
      date: '2026-09-14',
      startMinutes: 6 * 60,
      endMinutes: 23 * 60,
      unpaidBreakMinutes: 30,
    }),
  ];
  const found = assess(messy, profile).violations;
  assert.ok(found.length >= 5, `expected several violations, got ${found.length}`);
  for (const violation of found) {
    assert.match(violation.citation.section, /^(WAC|RCW) /);
    assert.match(violation.citation.url, /^https:\/\/app\.leg\.wa\.gov\//);
    assert.ok(violation.citation.quote.length > 40);
  }
});
