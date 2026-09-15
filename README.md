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

Working today: manual shift entry, reading shifts off a photo of a posted schedule, the
Washington rules engine, violation detail with the quoted statute behind each one, the running
total of what you are owed, the record screen with both purchase rails wired to RevenueCat, and
saving the record as a PDF. Shifts are stored on the device.

Not built yet: the app icon and the submission materials.

## How it works

You enter shifts by hand, or photograph the schedule your manager posted and let the app read the
days and hours off it. Recognition runs on the device, so the photo never leaves the phone, and
nothing it reads is saved until you have looked at it and confirmed it. A schedule shows hours
and never shows the breaks you were actually given, so the breaks stay yours to fill in, and that
gap is usually where the money is.

Each shift is checked against Washington minor labor law. Shifts that break a rule are flagged
with the regulation they violate, quoted and linked to the published text. Unpaid time is
totalled and multiplied by your wage.

The rules come from chapter 296-125 WAC, as amended by WSR 26-11-048 effective July 1 2026, plus
the meal and rest periods in WAC 296-126-092 and the overtime rule in RCW 49.46.130. Every
citation in `src/rules/law.ts` was read from the published text before it was written down.

Everything is stored on the device. There is no account, no server, and no upload.

## Tests

The money and time math is what makes this app worth anything, so it is the part that is tested.

```
npm test
```

Fifty five tests cover the daily and weekly hour caps, the night cutoffs, break math for each
age band, the minimum wage shortfall, and the overtime premium. `src/schedule.test.ts` covers
reading a schedule: the grid regrouping, the time formats a posted schedule actually uses, the
rows that have to be skipped, and the readings that have to be refused. `src/record.test.ts`
covers the printed record, including the escaping that keeps an employer name out of the markup.
`src/palette.test.ts` checks that every text color in both themes clears WCAG AA against the
surface it sits on, and `src/entitlement.test.ts` covers the entitlement check and the parent
link.

## Paying for the record

Logging shifts and finding violations is free and always will be. Charging a teenager to discover
they are being underpaid is not a business, it is a toll on the person with the least money in
the arrangement. What costs money is the full record: a dated PDF listing every shift, every
rule broken, and the statute behind it quoted in full, in the form you hand to someone else.

The person who pays is a parent, not the teenager, so there are two rails and the app does not
care which one delivers the entitlement.

The parent rail is the one that matters. The app mints its own customer id, keeps it on the
device, and gives the same id to the RevenueCat SDK and to the Web Purchase Link. The teenager
sends that link over whatever they already use to talk to their parent. The parent pays in a
browser, on their own phone, with their own card, and because the payment is attached to that
customer id the record opens on the teenager's phone. Nobody creates an account and no card ever
touches the teenager's device.

The second rail is an ordinary in-app purchase for anyone who would rather just buy it.

### Setup

Both rails need keys, and neither is committed. Copy `.env.example` to `.env` and fill it in.

1. Create a RevenueCat project.
2. Under Apps and providers, add a **Test Store**. It needs no Play Store account and no
   developer account, which is the reason it is used here. Copy the key into
   `EXPO_PUBLIC_REVENUECAT_KEY`.
3. In the Product Catalog, create an entitlement with the identifier `evidence_export`. The app
   reads that exact string from `src/entitlement.ts` and unlocks on nothing else.
4. Create a product for the record, attach it to that entitlement, and put it in an offering
   marked current. The app buys the first package in the current offering.
5. Add a Web Purchase Link for the same offering. Copy the token out of the sandbox URL into
   `EXPO_PUBLIC_REVENUECAT_WEB_TOKEN`, without any customer id attached, because the app appends
   its own. Web Billing runs on Stripe, so connect a Stripe account in sandbox mode and pay with
   a Stripe test card.

With `EXPO_PUBLIC_REVENUECAT_KEY` empty the app builds and runs normally and the record screen
says it is switched off. Nothing else in the app depends on it.

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
