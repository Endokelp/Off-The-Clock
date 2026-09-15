// The evidence record as a printable document. This file builds a string and nothing else, so
// it runs under node in record.test.ts without pulling in react-native. Turning the string into
// a PDF file is expo-print's job, in app/export.tsx.

import { light } from './palette.ts';
import type { Citation } from './rules/law.ts';
import {
  formatClock,
  formatDay,
  formatDollars,
  formatHours,
  minutesWorkedIn,
  type Assessment,
  type Profile,
  type Shift,
} from './rules/evaluate.ts';

// Everything interpolated below either came from the user typing it or from OCR reading a photo,
// so it is escaped on the way into the document rather than trusted.
const escape = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character,
  );

const fullDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const styles = `
  @page { margin: 18mm 15mm; }
  body {
    font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: ${light.onSurface};
    font-size: 11pt;
    line-height: 1.5;
    margin: 0;
  }
  h1 { font-size: 20pt; margin: 0 0 2pt; }
  h2 {
    font-size: 12pt;
    margin: 22pt 0 8pt;
    padding-bottom: 4pt;
    border-bottom: 1px solid ${light.outline};
  }
  .prepared { color: ${light.onSurfaceVariant}; font-size: 10pt; margin: 0; }
  .owed { color: ${light.money}; font-size: 30pt; font-weight: 700; margin: 14pt 0 2pt; }
  .summary { color: ${light.onSurfaceVariant}; margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  thead { display: table-header-group; }
  th {
    text-align: left;
    font-weight: 600;
    color: ${light.onSurfaceVariant};
    border-bottom: 1px solid ${light.outline};
    padding: 5pt 6pt 5pt 0;
  }
  td { padding: 5pt 6pt 5pt 0; border-bottom: 1px solid ${light.surfaceVariant}; }
  td.figure, th.figure { text-align: right; padding-right: 0; }
  .finding { break-inside: avoid; margin-bottom: 12pt; }
  .finding .headline { font-weight: 600; }
  .finding .when, .finding .under { color: ${light.onSurfaceVariant}; font-size: 10pt; }
  .finding .amount { color: ${light.money}; font-weight: 600; }
  .rule { break-inside: avoid; margin-bottom: 14pt; font-size: 10pt; }
  .rule .section { font-weight: 600; }
  .rule blockquote {
    margin: 4pt 0;
    padding-left: 10pt;
    border-left: 2px solid ${light.outline};
    color: ${light.onSurfaceVariant};
  }
  .rule a { color: ${light.money}; word-break: break-all; }
  .closing {
    margin-top: 24pt;
    padding-top: 10pt;
    border-top: 1px solid ${light.outline};
    color: ${light.onSurfaceVariant};
    font-size: 9pt;
  }
`;

const shiftRow = (shift: Shift) => {
  const meal = shift.mealBreakMinutes > 0 ? `${shift.mealBreakMinutes}m meal` : 'none';
  const rest = shift.restBreaksTaken > 0 ? `, ${shift.restBreaksTaken} rest` : '';
  return `<tr>
    <td>${escape(formatDay(shift.date))}</td>
    <td>${escape(shift.employer || 'Not recorded')}</td>
    <td>${escape(formatClock(shift.startMinutes))} to ${escape(formatClock(shift.endMinutes))}</td>
    <td>${escape(meal + rest)}</td>
    <td class="figure">${escape(formatHours(minutesWorkedIn(shift)))}</td>
  </tr>`;
};

const finding = (violation: Assessment['violations'][number]) => `
  <div class="finding">
    <div class="headline">${escape(violation.headline)}</div>
    <div class="when">${escape(formatDay(violation.date))}</div>
    <div>${escape(violation.detail)}</div>
    <div class="under">
      Under ${escape(violation.citation.section)}${
        violation.owedCents > 0
          ? `. <span class="amount">${escape(formatDollars(violation.owedCents))}</span> of the total`
          : '. No money attaches to this one, it is a limit on when and how long you may work'
      }.
    </div>
  </div>`;

const rule = (citation: Citation) => `
  <div class="rule">
    <div class="section">${escape(citation.section)}, ${escape(citation.title)}</div>
    <blockquote>${escape(citation.quote)}</blockquote>
    <a href="${escape(citation.url)}">${escape(citation.url)}</a>
  </div>`;

export const recordHtml = (
  shifts: readonly Shift[],
  profile: Profile,
  assessment: Assessment,
  preparedOn: Date,
): string => {
  const ordered = [...shifts].sort((a, b) => a.date.localeCompare(b.date));
  const covers =
    ordered.length === 0
      ? 'No shifts logged'
      : `${formatDay(ordered[0].date)} to ${formatDay(ordered[ordered.length - 1].date)}`;

  // Several findings can rest on the same statute, and the quotes run long, so each rule is
  // printed once at the end and referred to by section above.
  const cited = new Map<string, Citation>();
  for (const violation of assessment.violations) {
    cited.set(violation.citation.section, violation.citation);
  }

  const findings =
    assessment.violations.length === 0
      ? '<p>Nothing in this log breaks a Washington rule the app checks.</p>'
      : assessment.violations.map(finding).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Record of shifts worked</title><style>${styles}</style></head>
<body>
  <h1>Record of shifts worked</h1>
  <p class="prepared">Prepared ${escape(fullDate(preparedOn))} by Off the Clock. Covers ${escape(covers)}.</p>

  <p class="owed">${escape(formatDollars(assessment.owedCents))}</p>
  <p class="summary">
    is what this log adds up to across ${ordered.length} ${ordered.length === 1 ? 'shift' : 'shifts'}
    and ${escape(formatHours(assessment.minutesWorked))} worked, at the recorded rate of
    $${escape(profile.hourlyWage.toFixed(2))} an hour.
    ${assessment.violations.length} ${assessment.violations.length === 1 ? 'rule was' : 'rules were'} broken.
  </p>

  <h2>Shifts</h2>
  <table>
    <thead><tr>
      <th>Date</th><th>Where</th><th>Hours</th><th>Breaks taken</th><th class="figure">Worked</th>
    </tr></thead>
    <tbody>${ordered.map(shiftRow).join('')}</tbody>
  </table>

  <h2>What the log shows</h2>
  ${findings}

  ${cited.size === 0 ? '' : `<h2>Rules quoted above</h2>${[...cited.values()].map(rule).join('')}`}

  <p class="closing">
    This is a record of shifts entered in the Off the Clock app and the Washington rules that
    apply to them. It is not legal advice and it is not a claim. Every statute quoted here is
    linked in full so that anyone reading this can check it against the published text.
  </p>
</body>
</html>`;
};
