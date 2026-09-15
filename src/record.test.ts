import assert from 'node:assert/strict';
import { test } from 'node:test';

import { recordHtml } from './record.ts';
import { assess, type Profile, type Shift } from './rules/evaluate.ts';

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

const preparedOn = new Date('2026-09-14T12:00:00Z');

const build = (shifts: Shift[]) => recordHtml(shifts, profile, assess(shifts, profile), preparedOn);

test('the record carries the money figure and the shift that produced it', () => {
  // Four hours with 30 minutes docked and no rest break. At $17.13 the docked half hour is
  // $8.57 and the rest break worked through is $2.86.
  const html = build([shift({ id: '1', date: '2026-09-14', unpaidBreakMinutes: 30 })]);

  assert.match(html, /Record of shifts worked/);
  assert.match(html, /Prepared September 14, 2026/);
  assert.match(html, /\$11\.43/);
  assert.match(html, /Sandwich place/);
  assert.match(html, /Sep 14, 2026/);
  assert.match(html, /4:00pm to 8:00pm/);
});

test('an employer name that looks like markup cannot become markup', () => {
  const html = build([
    shift({ id: '1', date: '2026-09-14', employer: '<script>alert("x")</script>' }),
  ]);

  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot;x&quot;/);
});

test('a statute behind several findings is quoted once, not once per finding', () => {
  // Two identical illegal shifts in one week both miss the same rest break rule.
  const html = build([
    shift({ id: '1', date: '2026-09-14', endMinutes: 22 * 60 }),
    shift({ id: '2', date: '2026-09-15', endMinutes: 22 * 60 }),
  ]);

  const quoted = html.split('When working four or more hours').length - 1;
  assert.equal(quoted, 1);
  assert.match(html, /WAC 296-125-121\(2\)/);
  assert.match(html, /app\.leg\.wa\.gov/);
});

test('a clean log says so instead of printing an empty findings section', () => {
  const html = build([
    shift({ id: '1', date: '2026-09-19', endMinutes: 19 * 60, restBreaksTaken: 1 }),
  ]);

  assert.match(html, /Nothing in this log breaks a Washington rule/);
  assert.equal(html.includes('Rules quoted above'), false);
});

test('an empty log still produces a document rather than throwing', () => {
  const html = build([]);

  assert.match(html, /No shifts logged/);
  assert.match(html, /\$0\.00/);
});

// The contributor rules ban the long dash everywhere, and this document is the one artifact a
// judge or a manager reads outside the app, so the ban is checked rather than trusted.
test('the record contains no em dash or en dash', () => {
  const html = build([shift({ id: '1', date: '2026-09-14', unpaidBreakMinutes: 30 })]);

  assert.equal(html.includes('\u2014'), false);
  assert.equal(html.includes('\u2013'), false);
});
