# Off the Clock

Find out what your boss owes you.

Washington State limits how much a 16 or 17 year old can work during a school week. Twenty hours
a week. Eight hours a day. Nothing before 7am, nothing after 10pm on a school night. Almost no
teenager knows these rules exist, and almost none would push back if they did, because the person
breaking the rule is the person who writes the schedule.

Off the Clock closes that gap. You enter the shifts you already worked, and the app tells you
which ones were illegal, which hours went unpaid, and what that adds up to in dollars.

## Status

In development. Built for the RevenueCat Shipaton 2026 Next Gen Award, with a submission deadline
of September 30, 2026. This section will describe what actually runs, and it will not describe
anything that does not.

## How it works

You photograph the schedule your manager posted, or enter shifts by hand. Each shift is checked
against Washington minor labor law. Shifts that break a rule are flagged with the specific
regulation they violate, quoted and linked. Unpaid time is totalled and multiplied by your wage.

Everything is stored on the device. There is no account, no server, and no upload.

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
