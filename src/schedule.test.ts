import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readSchedule, rowsFrom, type ScannedLine } from './schedule.ts';

// September 14 2026 is a Monday, so the week the photo belongs to starts Sunday the 13th.
const anchor = '2026-09-14';

// A line as the recognizer reports it. Rows are 40 tall and 60 apart unless a test says otherwise.
const line = (text: string, row: number, left = 0): ScannedLine => ({
  text,
  left,
  top: row * 60,
  height: 40,
});

const read = (lines: ScannedLine[]) => readSchedule(lines, anchor);

test('a day and its hours in separate boxes at the same height are one row', () => {
  // A printed schedule puts the day in a left column and the hours in a right column, which the
  // recognizer reports as two boxes rather than one line.
  const rows = rowsFrom([
    line('4:00 PM - 8:00 PM', 0, 320),
    line('Mon 9/14', 0, 40),
    line('Tue 9/15', 1, 40),
    line('3:30 PM - 9:00 PM', 1, 320),
  ]);

  assert.deepEqual(rows, ['Mon 9/14 4:00 PM - 8:00 PM', 'Tue 9/15 3:30 PM - 9:00 PM']);
});

test('boxes whose centers sit more than half a line apart stay separate rows', () => {
  const rows = rowsFrom([
    { text: 'Mon 9/14', left: 0, top: 0, height: 40 },
    { text: '4pm - 8pm', left: 300, top: 60, height: 40 },
  ]);

  assert.equal(rows.length, 2);
});

test('a dated row with a marked time range becomes a shift', () => {
  assert.deepEqual(read([line('Mon 9/14 4:00 PM - 8:00 PM', 0)]), [
    {
      date: '2026-09-14',
      startMinutes: 16 * 60,
      endMinutes: 20 * 60,
      source: 'Mon 9/14 4:00 PM - 8:00 PM',
    },
  ]);
});

test('the short forms a posted schedule actually uses all read', () => {
  const cases: [string, number, number][] = [
    ['9/14 4p-8p', 16 * 60, 20 * 60],
    ['9/14 16:00-20:00', 16 * 60, 20 * 60],
    ['9/14 4:00-8:00', 16 * 60, 20 * 60],
    ['9/14 4-8', 16 * 60, 20 * 60],
    ['9/14 9am to 1pm', 9 * 60, 13 * 60],
    ['Sep 14 11:30 AM - 7:00 PM', 11 * 60 + 30, 19 * 60],
  ];

  for (const [text, startMinutes, endMinutes] of cases) {
    const found = read([line(text, 0)]);
    assert.equal(found.length, 1, text);
    assert.equal(found[0].startMinutes, startMinutes, text);
    assert.equal(found[0].endMinutes, endMinutes, text);
  }
});

test('an unmarked hour reads as the time a person would actually have worked it', () => {
  // Nobody starts a shift at four in the morning, but plenty start at nine.
  assert.equal(read([line('9/14 4-8', 0)])[0].startMinutes, 16 * 60);
  assert.equal(read([line('9/14 9-1', 0)])[0].startMinutes, 9 * 60);
  assert.equal(read([line('9/14 9-1', 0)])[0].endMinutes, 13 * 60);
});

test('a shift running past midnight ends on the next day clock', () => {
  const found = read([line('Fri 9/18 8:00 PM - 2:00 AM', 0)]);

  assert.equal(found[0].startMinutes, 20 * 60);
  assert.equal(found[0].endMinutes, 26 * 60);
});

test('a schedule that names only weekdays lands in the week of the photo', () => {
  const found = read([line('MONDAY 4pm - 8pm', 0), line('SATURDAY 10am - 4pm', 1)]);

  assert.deepEqual(
    found.map((shift) => shift.date),
    ['2026-09-14', '2026-09-19'],
  );
});

test('a date with no year takes the year nearest the day of the photo', () => {
  assert.equal(readSchedule([line('12/28 4pm-8pm', 0)], '2026-01-05')[0].date, '2025-12-28');
  assert.equal(readSchedule([line('1/07 4pm-8pm', 0)], '2025-12-29')[0].date, '2026-01-07');
  assert.equal(read([line('9/15/26 4pm-8pm', 0)])[0].date, '2026-09-15');
});

test('a header, a total, and a row with no hours are all skipped', () => {
  const found = read([
    line('SCHEDULE WEEK OF 9/14', 0),
    line('Employee: Sam', 1),
    line('Mon 9/14 4:00 PM - 8:00 PM', 2),
    line('Total hours 4', 3),
    line('Tue 9/15 CALLED OFF', 4),
  ]);

  assert.equal(found.length, 1);
  assert.equal(found[0].date, '2026-09-14');
});

test('a date written with dashes does not become the hours', () => {
  // The date reads as a range of bare digits, the hours carry a meridiem, and the marked one wins.
  const found = read([line('Mon 9-14 4:00 PM - 8:00 PM', 0)]);

  assert.equal(found[0].startMinutes, 16 * 60);
  assert.equal(found[0].endMinutes, 20 * 60);
});

test('hours a clock cannot show are dropped rather than guessed at', () => {
  assert.deepEqual(read([line('9/14 25:00 - 99:99', 0)]), []);
  assert.deepEqual(read([line('9/14 15pm - 18pm', 0)]), []);
});

test('a row read twice is logged once', () => {
  const found = read([line('Mon 9/14 4pm-8pm', 0), line('Mon 9/14 4pm-8pm', 1)]);

  assert.equal(found.length, 1);
});

test('shifts come back in the order they were worked', () => {
  const found = read([
    line('Wed 9/16 5pm-9pm', 0),
    line('Mon 9/14 4pm-8pm', 1),
    line('Mon 9/14 8am-11am', 2),
  ]);

  assert.deepEqual(
    found.map((shift) => `${shift.date} ${shift.startMinutes}`),
    ['2026-09-14 480', '2026-09-14 960', '2026-09-16 1020'],
  );
});

test('a word that merely starts with a day or a month is not a date', () => {
  // Without this the word monthly reads as Monday and janitor reads as January.
  assert.deepEqual(read([line('Monthly totals 4pm-8pm', 0)]), []);
  assert.deepEqual(read([line('Janitor 14 4pm-8pm', 0)]), []);
  assert.deepEqual(read([line('Satisfaction survey 9am-5pm', 0)]), []);

  // The real spellings still read, in full and abbreviated.
  assert.equal(read([line('Wednesday 4pm-8pm', 0)])[0].date, '2026-09-16');
  assert.equal(read([line('Thurs 4pm-8pm', 0)])[0].date, '2026-09-17');
  assert.equal(read([line('January 14 4pm-8pm', 0)])[0].date, '2027-01-14');
});

test('a photo of something that is not a schedule produces nothing', () => {
  assert.deepEqual(read([line('NUTRITION FACTS', 0), line('Calories 240', 1)]), []);
});
