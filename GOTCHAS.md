# Gotchas

Things that cost real time while building Off the Clock. Kept out of the readme because none of it
is about using the app, and kept out of `PHASE-STATE.md` so catching up stays cheap.

**Environment.** Node 24.1.0, Expo wants ^24.3.0, warning only. `.npmrc` pins
`legacy-peer-deps=true`; without it react-dom 19.3.0 against react 19.2.3 blocks every install.
Tests import with explicit `.ts` extensions or `node --test` will not resolve them, hence
`allowImportingTsExtensions` and `types: ["node"]` in tsconfig. react-native-paper ships no icons;
`@react-native-vector-icons/material-design-icons` provides them, loaded through `expo-font` in
`app/_layout.tsx` so it works in Expo Go too. Android builds need
`JAVA_HOME=/c/Program Files/Java/jdk-17`; the default `java` on PATH is 1.8 and will not build.
`rsvg-convert` and `magick` are on PATH from msys64, so SVG to PNG needs no browser and no npm
package.

**Memory is the constraint on this machine, and it misreports itself.** Metro defaults to one
worker per core, 13 here, and dies of `Zone Allocation failed` showing up as the app frozen at
`Bundling 26%` forever, not as an error. Start it as
`NODE_OPTIONS=--max-old-space-size=6144 npx expo start --max-workers 3`, bundles in ~30s. The
native C++ build fails with `The paging file is too small` from clang because it compiles four
ABIs; `gradlew assembleDebug -PreactNativeArchitectures=x86_64` turned a 7m38s failure into a 29s
success, and the Pixel_7 AVD is x86_64. The Gradle daemon holds ~1.8GB, so `gradlew --stop` before
bundling. First Gradle build 12m34s, later ones with a new native module ~3m30s.

**Running it.** `expo run:android` never exits; it builds, installs, then holds the terminal
running Metro. `EXPO_PUBLIC_` values are inlined at bundle time, so changing `.env` needs a Metro
restart. Background processes started with `nohup ... &` from a tool call get reaped; launch
detached through PowerShell `Start-Process cmd /c`. `adb kill-server` wipes the reverse port map,
so re-add `adb reverse tcp:8081 tcp:8081`. There is no `expo-dev-client` here but the app opens
through `offtheclock://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`; launching
`MainActivity` directly loads from assets and fails. Git Bash rewrites `/sdcard/...` into a Windows
path in adb arguments, so prefix with `MSYS_NO_PATHCONV=1`. A hot reload keeps component state, so
force stop and relaunch when a button stops responding after an edit.

**RevenueCat, verified against the installed types.** `react-native-purchases` 10.9.1, Test Store
needs 9.5.4+, no config plugin, autolinking handles it, works under the new architecture. On React
Native `Purchases.configure` takes no `store` field; the key alone selects Test Store, so
`{ apiKey, appUserID }` is the whole call. A Web Purchase Link takes the customer as a **path
segment**, `https://pay.rev.cat/<token>/<id>`, not a query parameter, and sandbox and production
are different tokens. The app mints its own customer id rather than using the RevenueCat anonymous
one, which carries a dollar sign and a colon and is replaced on reinstall; the minted id has to
survive a text message and a browser, so it is URL safe by construction and persisted.

**OCR and the PDF.** `expo-mlkit-ocr` 0.2.7 wraps ML Kit v2 on device. Two alternatives were ruled
out by reading their `android/build.gradle`: `@react-native-ml-kit/text-recognition` declares
`com.facebook.react:react-native:+`, the pre-0.71 coordinate, which does not resolve against RN
0.86, and `@infinitered/react-native-mlkit-text-recognition` pins expo-modules-core `~2.2.0` where
SDK 57 ships 3.x. The chosen one uses the current `expo-module-gradle-plugin` and pulls only the
bundled Latin model, so it needs no Play Services. The recognizer groups text into blocks that do
not match the rows of a printed schedule; `rowsFrom` in `src/schedule.ts` regroups every line by
the vertical centre of its box, and that regrouping is what makes a grid parse at all. The parser
requires a range separator between two times rather than matching times independently, or a wage
or a row number gets read as an hour; when a row holds more than one range, the one carrying a
meridiem or a colon wins. Day and month patterns spell out their endings, because `[a-z]*` after
`mon` matches monthly and after `jan` matches janitor. PDF is `expo-print` plus `expo-sharing`;
`expo-file-system` renames the file because expo-print names it randomly, and its **async `move`
never settles** on this setup, with no error and no rejection, leaving the button spinning.
`moveSync` works. `saveShift` in `src/store.tsx` computes its write from the shift list captured at
render, so calling it in a loop kept only the last shift; `addShifts` writes a whole scan at once.

**Staging screens for capture, from 5a.** The device has no `sqlite3`, so seeding AsyncStorage
means pulling `databases/RKStorage` with `adb exec-out run-as`, editing table
`catalystLocalStorage` with Python's `sqlite3`, pushing it back through
`run-as sh -c 'base64 -d > databases/RKStorage'` with the base64 line-wrapped on stdin, and
deleting `RKStorage-journal`. Exact Devpost pixels come from overriding the display,
`adb shell wm size 1179x2556` with `wm density 480`, which is 393x852dp and the same logical canvas
Devpost sizes for, then `wm size reset` after; never scale the image afterwards.
`adb shell cmd uimode night yes` does not reach a running RN app, so force stop and relaunch.
Every expo-router route is reachable as a deep link, `offtheclock://export`, `://scan`, `://shift`,
which beats tapping through a long list.
