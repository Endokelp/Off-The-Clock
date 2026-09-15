# Demo video — shot list

Hard limit 2:00, uploaded to YouTube or Vimeo, public or unlisted. The single most common way
these entries lose points is a video that shows something the app does not do, so every shot below
is a screen that exists and works today.

Record the screen, not a phone held in your hand. On the emulator:

```
adb shell screenrecord --size 1080x2400 --bit-rate 8000000 /sdcard/demo.mp4
MSYS_NO_PATHCONV=1 adb pull /sdcard/demo.mp4
```

`screenrecord` caps at 3 minutes per clip, which is more than enough. Record each section
separately and cut them together rather than trying for one clean take.

## Before you record

- Seed the device with the demo week (three weeks, 18 shifts, $138.57). The state is already on
  the emulator from the screenshot pass.
- Dark mode on: `adb shell cmd uimode night yes`.
- Have a printed or on-screen schedule ready to photograph for the scan shot.
- Silence notifications so nothing lands in the status bar mid-take.

## The cut

**0:00–0:10 — Say the thing.** You on camera or just your voice over the home screen. One
sentence, your own words, something close to: *"I'm 17, I work at a grocery store, and it turns out
my schedule was illegal."* Do not open with the app name or a feature. Open with the fact.

**0:10–0:25 — The problem, fast.** Over the home screen at $0.00 or a fresh install. Washington
caps a 16 or 17 year old at 20 hours a school week and 4 hours on a school night, and owes them a
paid rest break every three hours. Nobody tells you this, and the person breaking the rule writes
the schedule. Twelve seconds, no more.

**0:25–0:55 — Scan a real schedule.** This is the shot that proves the app is real. Open *Scan a
schedule*, photograph an actual posted schedule, and let the reading happen on screen without a
cut. Show the rows it found, correct one by hand if it gets one wrong — **leave that in**, a demo
that shows a correction is more believable than one that goes perfectly. Confirm, and let the home
screen number jump.

**0:55–1:15 — The number, then the receipt.** Hold on "Your employer owes you $138.57 / 34 problems
found" for a beat. Then tap one violation open and let the statute sit on screen long enough to
read: the plain sentence, `WAC 296-125-121(2)`, the quoted rule, and *Read the rule*. Say once that
every citation was read from the published text. This is the credibility shot; do not rush it.

**1:15–1:40 — Who pays, and why that shape.** Open *Your record*. Say the part that is actually
interesting: the free tier finds what you are owed and always will, because charging a teenager to
discover they are underpaid is a toll on the person with the least money in the room. What costs
money is the record you hand to someone else, and a parent pays for it — in their own browser, on
their own phone, with their own card, through a RevenueCat Web Purchase Link carrying the customer
id this app minted. Show the share sheet with the link in it.

> **Requires the RevenueCat project to exist.** Until then this screen reads "the record is
> switched off in this build." Do not film around that and imply a purchase happened. Create the
> project first, run one purchase, then shoot this section.

**1:40–1:55 — The PDF.** Save the record and let the share sheet open with
`off-the-clock-record.pdf`. Flick through a page or two. Five pages of dated shifts and quoted
statutes is the whole product in one artifact.

**1:55–2:00 — Close.** Back to the home screen and the number. One line, your own: what you would
do with it.

## Rules of thumb for the edit

- Every second of screen is the real app. No mockups, no motion graphics of features that do not
  exist, no roadmap slide.
- Your voice, not a synthetic one. The judges' notes single out AI-written and AI-voiced
  submissions as an immediate tell.
- No music bed loud enough to compete with speech. Under it or not at all.
- If a section runs long, cut the problem explanation, not the demo. Nobody has ever lost a
  hackathon for under-explaining.
- Watch it once at full length before uploading and check that nothing on screen claims something
  the build does not do.

## Screenshot capture, for reference

The Devpost screenshots in this folder were captured at the exact required 1179x2556 by overriding
the emulator display rather than scaling an image afterwards:

```
adb shell wm size 1179x2556 && adb shell wm density 480
adb exec-out screencap -p > shot.png
adb shell wm size reset && adb shell wm density reset
```

480dpi at that size gives 393x852dp, which is the same logical canvas as the phone Devpost sizes
for, so the layout in the screenshot is the layout a reviewer would see.
