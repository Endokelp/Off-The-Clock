# Off the Clock

Find out what your boss owes you.

Washington State limits how much a 16 or 17 year old can work during a school week. Twenty hours
a week. Four hours on a school day that comes before another school day. Nothing before 7am,
nothing after 10pm on a school night. A ten minute paid rest break every three hours, and a meal
break before the sixth. Almost no teenager knows these rules exist, and almost none would push
back if they did, because the person breaking the rule is the person who writes the schedule.

Off the Clock closes that gap. You enter the shifts you already worked, and the app tells you
which ones were illegal, which hours went unpaid, and what that adds up to in dollars.

## Status

In development. This section describes what actually runs, and it does not describe anything
that does not.

Working today: manual shift entry, the Washington rules engine, violation detail with the quoted
statute behind each one, and the running total of what you are owed. Shifts are stored on the
device.

Not built yet: schedule photo OCR, the evidence export, and the purchase flow that pays for it.

## How it works

You enter shifts by hand. Each one is checked against Washington minor labor law. Shifts that
break a rule are flagged with the regulation they violate, quoted and linked to the published
text. Unpaid time is totalled and multiplied by your wage.

The rules come from chapter 296-125 WAC, as amended by WSR 26-11-048 effective July 1 2026, plus
the meal and rest periods in WAC 296-126-092 and the overtime rule in RCW 49.46.130. Every
citation in `src/rules/law.ts` was read from the published text before it was written down.

Everything is stored on the device. There is no account, no server, and no upload.

## Tests

The money and time math is what makes this app worth anything, so it is the part that is tested.

```
npm test
```

Twenty five tests cover the daily and weekly hour caps, the night cutoffs, break math for each
age band, the minimum wage shortfall, and the overtime premium. `src/palette.test.ts` checks that
every text color in both themes clears WCAG AA against the surface it sits on.

## What this app does not do

It does not give legal advice, and it does not file anything on your behalf. It shows you the
regulation and it shows you your own record. What you do with that is your decision, and it is
worth talking to an adult you trust or to Washington State Labor and Industries.

## Building

Requires Node and the Expo tooling. Android only.

```
npm install
npx expo run:android
```

## License

MIT. See LICENSE.
