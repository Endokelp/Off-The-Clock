// Turning a photographed schedule into shifts. The recognizer hands back text lines with the
// box each one sat in, and this file decides what those lines mean. It imports nothing native
// so it runs under node in schedule.test.ts, and nothing here is trusted: every shift it returns
// goes to the user for confirmation before it is saved.

import { addDays, weekStartOf } from './rules/evaluate.ts';

// The subset of a recognizer result this parser needs. Keeping it to four fields means the
// parser does not depend on the OCR library's own types.
export type ScannedLine = {
  text: string;
  left: number;
  top: number;
  height: number;
};

export type ScannedShift = {
  date: string;
  startMinutes: number;
  endMinutes: number;
  // The line this came from, so the confirmation screen can show what was read.
  source: string;
};

const monthNames = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const weekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const dayInMs = 86400000;

const isoOf = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const daysBetween = (from: string, to: string) =>
  Math.abs(Date.parse(`${from}T00:00:00Z`) - Date.parse(`${to}T00:00:00Z`)) / dayInMs;

const isRealDate = (year: number, month: number, day: number) => {
  const made = new Date(Date.UTC(year, month - 1, day));
  return made.getUTCMonth() === month - 1 && made.getUTCDate() === day;
};

// A posted schedule almost never prints the year. The reading that survives is the one closest
// to the day the photo was taken, which is what picking the nearest candidate year does.
const nearestYear = (month: number, day: number, anchor: string) => {
  const anchorYear = Number(anchor.slice(0, 4));
  return [anchorYear - 1, anchorYear, anchorYear + 1]
    .filter((year) => isRealDate(year, month, day))
    .map((year) => isoOf(year, month, day))
    .sort((a, b) => daysBetween(a, anchor) - daysBetween(b, anchor))
    .at(0);
};

const findDate = (line: string, anchor: string): { date: string; rest: string } | null => {
  const numeric = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    const written = numeric[3];
    const year = written ? Number(written.length === 2 ? `20${written}` : written) : null;
    const date =
      year !== null
        ? isRealDate(year, month, day)
          ? isoOf(year, month, day)
          : undefined
        : month >= 1 && month <= 12
          ? nearestYear(month, day, anchor)
          : undefined;
    if (date) return { date, rest: line.replace(numeric[0], ' ') };
  }

  // The endings are spelled out rather than allowing any letters, so that a word merely starting
  // with a month, such as janitor, is not read as January.
  const named = line.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:uary|ruary|ch|il|e|y|ust|t|tember|ober|ember)?\.?\s+(\d{1,2})\b/,
  );
  if (named) {
    const date = nearestYear(monthNames.indexOf(named[1]) + 1, Number(named[2]), anchor);
    if (date) return { date, rest: line.replace(named[0], ' ') };
  }

  // A schedule that names only weekdays is the schedule for one week, and the week it belongs to
  // is the week the photo was taken in.
  const weekday = line.match(/\b(sun|mon|tue|wed|thu|fri|sat)(?:day|s|sday|rs|rsday|nesday|urday)?\b/);
  if (weekday) {
    const offset = weekdayNames.indexOf(weekday[1]);
    return { date: addDays(weekStartOf(anchor), offset), rest: line.replace(weekday[0], ' ') };
  }

  return null;
};

type ReadTime = { hour: number; minute: number; meridiem: 'a' | 'p' | null };

// A range rather than two separate times. Requiring the dash or the word between them is what
// stops a wage, a row number, or an employee count from being read as an hour.
const rangePattern =
  /\b(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?\s*(?:-|\u2013|\u2014|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?/g;

const readTime = (
  hour: string,
  minute: string | undefined,
  meridiem: string | undefined,
): ReadTime | null => {
  const read = {
    hour: Number(hour),
    minute: Number(minute ?? 0),
    meridiem: (meridiem as 'a' | 'p' | undefined) ?? null,
  };
  if (read.hour > 23 || read.minute > 59) return null;
  // Twelve is the largest hour a clock with a meridiem has, so 15pm is a misread, not a time.
  if (read.meridiem !== null && read.hour > 12) return null;
  return read;
};

// A date written with dashes looks like a range too, so when a row holds more than one, the
// range carrying a meridiem or a colon beats the one that is only digits.
const readRange = (text: string) => {
  const ranges: { start: ReadTime; end: ReadTime; marked: number }[] = [];

  for (const match of text.matchAll(rangePattern)) {
    const start = readTime(match[1], match[2], match[3]);
    const end = readTime(match[4], match[5], match[6]);
    if (start === null || end === null) continue;
    ranges.push({
      start,
      end,
      marked: (match[3] ?? match[6] ? 2 : 0) + (match[2] ?? match[5] ? 1 : 0),
    });
  }

  return ranges.sort((a, b) => b.marked - a.marked).at(0) ?? null;
};

const withMeridiem = (time: ReadTime, meridiem: 'a' | 'p') => {
  const hour = time.hour % 12;
  return (meridiem === 'p' ? hour + 12 : hour) * 60 + time.minute;
};

// A schedule that prints "4-8" leaves the reader to know that nobody starts a shift at four in
// the morning. Hours 7 through 11 read as morning, everything else as afternoon.
const startOf = (time: ReadTime) => {
  if (time.meridiem !== null) return withMeridiem(time, time.meridiem);
  if (time.hour >= 13) return time.hour * 60 + time.minute;
  return withMeridiem(time, time.hour >= 7 && time.hour <= 11 ? 'a' : 'p');
};

const maxShiftMinutes = 16 * 60;

// The end has to land after the start, so an unmarked end is read whichever way makes a shift a
// person could actually have worked.
const endOf = (time: ReadTime, startMinutes: number) => {
  const candidates =
    time.meridiem !== null
      ? [withMeridiem(time, time.meridiem)]
      : time.hour >= 13
        ? [time.hour * 60 + time.minute]
        : [withMeridiem(time, 'p'), withMeridiem(time, 'a')];

  for (const candidate of candidates) {
    const wrapped = candidate <= startMinutes ? candidate + 1440 : candidate;
    if (wrapped - startMinutes <= maxShiftMinutes) return wrapped;
  }
  return null;
};

// ponytail: no correction of the characters a recognizer confuses, such as O for 0. A line read
// wrong arrives on the confirmation screen and is fixed there, and that screen has to exist
// whatever the parser does.
const parseRow = (row: string, anchor: string): ScannedShift | null => {
  const found = findDate(row.toLowerCase(), anchor);
  if (!found) return null;

  const range = readRange(found.rest);
  if (range === null) return null;

  const startMinutes = startOf(range.start);
  const endMinutes = endOf(range.end, startMinutes);
  if (endMinutes === null || endMinutes <= startMinutes) return null;

  return { date: found.date, startMinutes, endMinutes, source: row.trim() };
};

// A posted schedule is a grid, and the recognizer reports the day and the hours as separate
// boxes. Lines whose vertical centers sit within half a line height of each other belong to one
// row of that grid, so they are joined left to right before anything is read out of them.
export const rowsFrom = (lines: readonly ScannedLine[]): string[] => {
  const rows: ScannedLine[][] = [];

  for (const line of [...lines].sort((a, b) => a.top - b.top)) {
    const open = rows.at(-1);
    const fits =
      open !== undefined &&
      Math.abs(line.top + line.height / 2 - (open[0].top + open[0].height / 2)) <=
        Math.max(open[0].height, line.height) / 2;

    if (fits) open.push(line);
    else rows.push([line]);
  }

  return rows.map((row) =>
    [...row]
      .sort((a, b) => a.left - b.left)
      .map((line) => line.text.trim())
      .filter((text) => text !== '')
      .join(' '),
  );
};

export const readSchedule = (lines: readonly ScannedLine[], anchor: string): ScannedShift[] => {
  const found = rowsFrom(lines)
    .map((row) => parseRow(row, anchor))
    .filter((shift): shift is ScannedShift => shift !== null);

  // A recognizer that splits one row in two reads the same shift twice, so a date and start time
  // already seen keeps its first reading instead of logging the shift again.
  const seen = new Map<string, ScannedShift>();
  for (const shift of found) {
    const key = `${shift.date} ${shift.startMinutes}`;
    if (!seen.has(key)) seen.set(key, shift);
  }

  return [...seen.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes,
  );
};
