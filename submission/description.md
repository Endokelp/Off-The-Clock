# Off the Clock — Devpost submission

> **Draft. Rewrite the prose in your own voice before pasting it.** Judges have said they spot
> AI-written submission text immediately, and this is the one part of the project where that
> matters. The facts below are checked against the code. The voice is not yours yet.
>
> Two places need you and cannot be filled in for you: the inspiration paragraph and the
> RevenueCat paragraph about a purchase that has actually run. Both are marked.

## Tagline

Find out what your boss owes you.

## Inspiration

> **[WRITE THIS YOURSELF — three or four sentences.]** The research on past winners says lived
> experience is what separates the top of the pile from the rest. What belongs here is the true
> version of: whose schedule was it, what did the shift actually look like, and when did you find
> out there was a rule about it. If the story is someone else's, say so plainly. Do not invent one.

Washington sets hard limits on how much a 16 or 17 year old can work during a school week. Twenty
hours a week. Four hours on a school day that comes before another school day. Nothing after
10:00 p.m. on a school night. A ten minute paid rest break every three hours, and a meal break
before the sixth. Almost no teenager knows these rules exist, and almost none would push back if
they did, because the person breaking the rule is the person who writes the schedule.

## What it does

You enter the shifts you already worked, by hand or by photographing the schedule your manager
posted. The app checks each one against Washington minor labor law, flags the shifts that broke a
rule, quotes the regulation behind it, totals the unpaid time, and turns it into a dollar figure.

Three weeks of a typical after-school job — six shifts a week at $16.50 an hour — comes back as
$138.57 owed across 34 violations: rest breaks never given, thirty minutes docked for a meal break
that never happened, and a wage sitting below the 2026 state minimum of $17.13.

It does not give legal advice and it does not file anything. It shows you the regulation and it
shows you your own record.

## How I built it

Expo, React Native and TypeScript. Android only, built on Windows.

The rules live in `src/rules/law.ts` as data rather than as branches: every limit is a row carrying
the statute it comes from, the published text quoted verbatim, and a link. They come from chapter
296-125 WAC as amended by WSR 26-11-048 effective July 1 2026, the meal and rest periods in
WAC 296-126-092, and the overtime rule in RCW 49.46.130. Every citation was read from the
published text before it was written down, because an app that cites the wrong subsection at a
teenager is worse than no app at all.

`src/rules/evaluate.ts` is the engine. Money is computed in cents throughout, never in floats.

Reading a posted schedule uses ML Kit text recognition on the device, through `expo-mlkit-ocr`.
The photo never leaves the phone, and nothing it reads is saved until you have looked at it and
confirmed it. The hard part was not recognition. The recognizer groups text into blocks of its own
choosing, and those blocks do not line up with the rows of a printed schedule. `rowsFrom` in
`src/schedule.ts` regroups every recognized line by the vertical centre of its bounding box, so a
day sitting in a left column and the hours sitting in a right column rejoin into the row a human
sees. That regrouping is the thing that makes a grid parse at all.

Fifty five tests run under `node --test` with type stripping and no test framework: the daily and
weekly hour caps, the night cutoffs, break math for each age band, the minimum wage shortfall, the
overtime premium, the time formats a real posted schedule uses and the readings that have to be
refused, the escaping that keeps an employer name out of the PDF markup, and a check that every
text colour in both themes clears WCAG AA against the surface it sits on.

## How I used RevenueCat

Logging shifts and finding violations is free and always will be. Charging a teenager to discover
they are being underpaid is not a business, it is a toll on the person with the least money in the
arrangement. What costs money is the full record: a dated PDF listing every shift, every rule
broken, and the statute behind it quoted in full, in the form you hand to someone else.

The person who pays is a parent, not the teenager. That is a real constraint rather than a pricing
preference. Most 16 year olds do not have a card, and asking one to enter payment details in order
to prove they are being underpaid is the wrong ask. So the app ships two rails and does not care
which one delivers the entitlement.

**The parent rail.** The app mints its own customer id, keeps it on the device, and hands the same
id to the RevenueCat SDK and to a Web Purchase Link. The teenager sends that link over whatever
they already use to talk to their parent. The parent pays in a browser, on their own phone, with
their own card, and because the payment is attached to that customer id, the record unlocks on the
teenager's phone. Nobody creates an account and no card touches the teenager's device. RevenueCat
Web Billing is what makes this shape possible at all: a purchase completed entirely outside the
app that still resolves to an entitlement inside it.

**The in-app rail.** An ordinary purchase through the RevenueCat Test Store, for anyone who would
rather just buy it.

One detail worth recording. The app deliberately does not use RevenueCat's anonymous customer id.
That id carries a dollar sign and a colon, and it is replaced on reinstall. The id here has to
survive being pasted into a text message and opened in a browser, so the app mints one that is URL
safe by construction and persists it on the device.

Both rails are wired and were verified running on a device: with no key present the free tier is
untouched, an invalid key degrades to a usable screen instead of a spinner, and the share sheet
carries the Web Purchase Link with the same customer id found in device storage.

> **[REPLACE THIS PARAGRAPH once the RevenueCat project exists and a purchase has actually run.]**
> Say plainly what was tested end to end: which rail, which store, which entitlement identifier
> unlocked what. Do not describe a completed purchase before you have watched one complete.

## Challenges

The problem this app solves is invisible by design, so the hardest product decision was what the
first screen says. It says "find out what your boss owes you." It does not say compliance, and it
does not say labor law until you have already seen a number.

Technically, the memory ceiling on my machine was the real constraint, and it misreports itself
twice. Metro defaults to one worker per core and dies of heap exhaustion that surfaces as the app
frozen at "Bundling 26%" forever rather than as an error. The native C++ build fails with "the
paging file is too small" because it compiles four ABIs by default; building only the one the
emulator uses turned a 7 minute 38 second failure into a 29 second success.

The one that cost the most time taught me the most. `expo-file-system`'s async `move` never settled
on this setup: no error, no rejection, nothing in the log, just a button spinning forever. The
synchronous variant works. A hang is not an error, and an empty log is itself evidence.

## What I learned

Verify an SDK against its installed type definitions rather than against memory. Three things I
assumed about RevenueCat were wrong and the types said so in under a minute — on React Native
`Purchases.configure` takes no `store` field, and a Web Purchase Link takes the customer id as a
path segment rather than as a query parameter.

Read a package before adding it. Two of the three OCR libraries I considered were ruled out by
opening their `android/build.gradle`: one declares the pre-0.71 React Native Maven coordinate,
which does not resolve against React Native 0.86, and the other builds on a version of
expo-modules-core two majors behind what SDK 57 ships. That took a minute and saved a failed
native build.

And run the thing. Four defects in the rules engine were caught by using the app on a device
rather than by reading the code, including a minors-only statute being cited at an 18 year old.

## What's next

More states. The rules are already data rather than branches, so a second state is a new file
rather than a refactor. Beyond that, the honest next step is the unglamorous one: putting the
record in front of someone who can act on it, and finding out whether it holds up.

## Built with

Expo · React Native · TypeScript · React Native Paper · RevenueCat (SDK, Test Store, Web Billing)
· ML Kit text recognition on device · expo-print · node:test

## Links

- Repo: https://github.com/Endokelp/Off-The-Clock (MIT)
