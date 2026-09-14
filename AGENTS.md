# Off the Clock

Rules for every agent working in this repository. Claude Code, Codex, Cursor, or anything else.
Read this before writing a line. These are not suggestions and they are not stylistic
preferences. This repository is read and judged by humans.

## What this is

An Android app that tells a teenager what their employer owes them.

The user enters shifts they have already worked, either by photographing a posted schedule or by
entering them manually. The app checks each shift against Washington State minor labor law, marks
the illegal ones with the exact rule broken, totals unpaid time and converts it to money, and
exports a timestamped evidence record.

The pitch is "find out what your boss owes you." It is never described as labor law compliance
software. The user opens this app for money, not for law.

Two constraints follow from that, and neither is negotiable:

1. **The payoff happens in the first session.** The user enters shifts they already worked and
   sees a real number within about thirty seconds. Nothing in this app may require the user to
   log data for days before it becomes useful.
2. **Logging and violation detection are free forever.** Charging a teenager to discover they are
   being underpaid is indefensible. Revenue comes from the evidence export, and the payer is a
   parent, not the teenager.

## Scope

In scope for the first release:

- Manual shift entry
- Schedule photo OCR
- Washington minor labor rules engine with real statutory citations
- Violation display and money owed
- RevenueCat purchase flow
- Evidence export as PDF

Out of scope. Do not build these unless asked:

- Any state other than Washington. Encoding one state correctly beats fifty states badly.
- Accounts, login, sync, or a backend for user data. The app is local first.
- Anything that generates a legal filing or gives legal advice. See Legal posture below.
- Notifications, streaks, gamification, social features, AI chat.

## Stack

Expo and React Native, TypeScript, Android only. Built and tested from Windows.

There is no Mac available, so there is no iOS build and no Xcode. Do not propose one. No paid
Apple or Google developer account exists and none is needed, because Next Gen entries require no
store release. In app purchases run through the RevenueCat Test Store, which needs no store
account at all. Web purchases run through RevenueCat Web Billing in Stripe sandbox.

## Legal posture

This app does not practice law. It keeps a record and shows the user the statute.

- Every violation cites the specific Washington Administrative Code or Revised Code of Washington
  section, quoted accurately, with a link.
- The app never says "you should sue" or "file this claim." It says what the rule is and what the
  log shows.
- The export is titled as a record, not as a filing.
- Citations are verified against the published text before being written into code. If a citation
  cannot be verified it does not ship. A wrong statute number is worse than a missing feature.

## Writing rules

Everything written here is read by judges: code comments, commit messages, the README, variable
names, and every string in the app. All of it must read as though a careful person wrote it,
because the alternative is obvious to anyone who reads a lot of machine generated text.

### Dashes

Do not use an em dash or an en dash anywhere. Not in comments, commit messages, documentation,
README text, app copy, or issue and pull request descriptions. Use a period, a comma, a colon, or
restructure the sentence.

Hyphens are fine where a hyphen genuinely belongs: well-formed, react-native, Off-The-Clock,
twenty-four. This rule targets the long dash used as a dramatic pause, which is the single most
recognizable signature of generated text.

### Banned vocabulary

Do not use: delve, leverage as a verb, robust, seamless, seamlessly, elevate, unlock outside its
literal product meaning, harness, tapestry, realm, figurative landscape, testament, crucial,
comprehensive, cutting-edge, game-changing, revolutionize, empower, streamline, foster, embark,
figurative navigate, meticulous, intricate, pivotal, holistic.

### Banned constructions

- "It is not just X, it is Y" and every variant of that shape.
- "In today's fast-paced world" and any opener that sets a scene before saying anything.
- "Let's dive in", "Here's the thing", "The key takeaway", "At its core".
- Rhetorical questions used as headings.
- Three item lists where every item is a single adjective. Real writing is uneven.
- Bolding the first two words of every bullet in a list.
- Emoji anywhere in code, commits, README headings, or app copy.

### Comments

Comments explain why, never what. A comment that restates the line beneath it gets deleted.

Bad: `// loop through the shifts`

Good: `// Washington counts a school week as Sunday through Saturday, not the pay period.`

No step narration such as "Step 1:" or "First, we". No banner comments made of equals signs. No
TODO without a name and a reason.

## Code rules

- Reuse what already exists in this repo before writing anything new. Look first.
- Standard library and platform features before a dependency. Never add a dependency for what a
  few lines can do.
- No abstraction with one implementation. No factory, no interface, no config value that never
  changes. Write the concrete thing.
- Immutability by default. Return new objects rather than mutating arguments.
- Files stay under roughly 400 lines. A file past that is doing too much.
- No console.log in committed code.
- No commented out code. Git remembers it.
- No blanket try/catch. Handle an error where it can actually be handled, or let it surface.
- Names say what the thing is. No `data`, `temp`, `result`, `info`, `handler`, and no `utils`
  file that becomes a dumping ground.
- Validate anything crossing a trust boundary. OCR output is untrusted input, so treat it as such.
- Money and time calculations get a test. They are the entire product, and an error there is the
  one bug that makes the app worthless.

## Design

Android native throughout. Material Design 3 components, Android back behavior, system
typography. An app that looks like a web page in a wrapper reads as amateur immediately.

The principles below are real and named. They are cited because the design decisions in this app
follow them deliberately, and a reviewer should be able to see why each screen is the way it is.

**Hick's Law.** Decision time increases with the number and complexity of choices. The home
screen offers one primary action. Secondary actions live behind a menu or further down.

**Fitts's Law.** Time to acquire a target depends on its size and distance. Primary actions sit in
the lower third where a thumb rests. No touch target smaller than 48dp, which is also the Android
accessibility minimum.

**Doherty Threshold.** Attention holds when a system responds within 400ms. OCR and rule
evaluation show immediate progress and partial results. There is never a blank screen with a
spinner and no explanation.

**Jakob's Law.** Users expect this app to behave like the other apps on their phone. Use standard
Material patterns rather than inventing navigation.

**Von Restorff effect.** The item that differs is the item remembered. Exactly one number on the
results screen is large and colored. Everything else is quiet. That number is what the employer
owes.

**Tesler's Law, the conservation of complexity.** Complexity cannot be removed, only moved. It
lives in the app, which knows the statutes, not in the user, who only enters shifts.

**Miller's Law.** Working memory is limited. Violation details are chunked and progressively
disclosed rather than listing every rule at once.

**Aesthetic usability effect.** People perceive a well made interface as easier to use. Spacing
and alignment are not decoration, they are part of whether the app is believed.

Concrete rules that follow:

- 8dp spacing grid. Every margin and padding is a multiple of 8, or 4 where 8 is too coarse.
- Material 3 type scale. Do not invent font sizes.
- Body text contrast of at least 4.5 to 1, large text at least 3 to 1. WCAG AA, verified rather
  than assumed.
- One accent color, used for the money figure and the primary action and nowhere else.
- Dark mode from the start, not retrofitted.
- No shadow, gradient, or animation that does not communicate state or hierarchy.

## Git

The commit history is part of what is judged. It should read as sixteen days of steady work by
someone who knew where they were going.

Format: `type: description`

Types: feat, fix, refactor, docs, test, chore, perf, style, build.

- Lowercase after the colon. Imperative mood. No trailing period.
- Subject line under 72 characters.
- A body only when the change needs its reason explained, wrapped at 72 columns.
- No emoji, no em dashes, no exclamation marks.

Good: `feat: add school week hour cap to the rules engine`

Good: `fix: correct meal break threshold to the fifth hour`

Bad: `Updated stuff`, `feat: Add Amazing New Feature!`, `chore: various improvements`

Commit rules:

- Never attribute an AI. No `Co-authored-by` for Claude, Codex, Cursor, or any model. No
  "Generated with" trailer. No AI in the author or committer field. Commits carry the builder's
  identity only.
- Small commits that each do one thing, not one enormous commit containing the whole app.
- Commit when something works, several times per working session rather than once at the end.
- Never commit secrets. API keys live in environment variables and nowhere else.
- Do not force push to main and do not rewrite published history.

## Definition of done

A task is done when the check has been run, not when the code looks right.

- The app builds and launches on a real Android device.
- The specific behavior has been exercised and observed, with a screenshot when it is visual.
- Money and time logic has a test that fails if the logic breaks.
- Failures are reported verbatim. Never write "should work" or "this should now be fixed."

Claims about existing code cite a file and a line number.
