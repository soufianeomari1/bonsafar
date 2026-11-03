# Motion spec: Safar mascot and welcome screen

This folder is the source of truth for the mascot and the welcome screen animations.
The two HTML files are **living references**: open them in a browser to watch every loop. Their CSS `@keyframes` give the exact timings, easings and transforms to reproduce in React with `motion/react`.

| File | What it shows |
|---|---|
| `welcome-v2.html` | Screen 0, the welcome screen, with its 10-second demo loop |
| `safar-states.html` | The 6 mascot states side by side |
| `safar.svg` | The mascot at rest, static (base geometry, app icon source) |
| `screens/*.html` | The new art direction for screens 01a, 02, 03, 04, 05, 07, 08 and 10, with Safar alive on each |

The `screens/` files replace the old mockups in `design/maquettes/` for the look of those screens. Keep the old mockups for the other screens (01b, 01c, 06, 09, 10b, J1, J2) and add Safar to them following the table "Safar across the app" below.

## Safar across the app

Safar is present on almost every screen, always doing something meaningful, never decorative noise. One Safar per screen, never more.

| Screen | Reference | Safar | What he does |
|---|---|---|---|
| 00 Welcome | `welcome-v2.html` | `idle`, 112 px, hero | Floats above the demo loop |
| 01a Profile, language | `screens/01a-onboarding.html` | `idle`, 96 px | Asks the question in a speech bubble, like a host |
| 01b, 01c Profile steps, trust card | old mockups | `idle`, 64 px, top left | Same bubble pattern; on the trust card he switches to `found` when the user taps "Mfhoum" |
| 02 Home | `screens/02-home.html` | `idle`, 84 px, next to the mic | Bubble "Brek w hder"; switches to `listening` the moment the mic is pressed |
| 03 Voice | `screens/03-voice.html` | `listening`, 170 px, center | Wings and sound arcs follow the real volume (`level`); words appear live under him |
| 04 Understood | `screens/04-understood.html` | `found`, 64 px, agent row | Small hop and sparkle, says "Mfhoum ! Hadchi li fhemt"; if a question is needed he switches to `thinking` next to the question card |
| 05 Flight plan | `screens/05-flight-plan.html` | `thinking`, 62 px | **He replaces the plane of A3**: he flies down the route from stop to stop, the blue trail follows him, each landing ticks |
| 06 Result | old mockup | `idle` flying along the arc (A5) | Same move as on screen 07's map |
| 07 Package | `screens/07-package.html` | flying along the map arc, then wink in the smart tip card | The smart tip is signed "Le conseil de Safar"; the plane icon in "Ana mwafeq" takes off (A7) |
| 08 Ready to go | `screens/08-ready.html` | `found`, 110 px | Jumps with sparkles when the tiles land (success haptic) |
| 09 Check and continue | old mockup | `idle`, 48 px near the shield line | Calm, reassuring: "BonSafar never sees your card" |
| 10 Travel file | `screens/10-travel-file.html` | `bye`, 84 px, top right | Winks and flies off with his dotted trail while the boarding pass prints (A8) and the stamp lands |
| 10b Poster | old mockup | `bye`, small, on the boarding pass corner | Signature "MADE WITH BONSAFAR" |
| Errors anywhere | none | `oops` | Mic denied, network down, replay switch: shake, warn haptic, then a clear message |
| J1 Jury, J2 Desktop | old mockups | `idle` in the header, `thinking` in the phone during the run, `found` on the end card | In the Under the hood panel he stays out of the way |

Rules: Safar never covers content or a button, never blocks a tap, and respects `prefers-reduced-motion`. Darija lines in his bubbles go through i18n like every string.

## What changed in the art direction

- Sky gradient `#DCEBFF` to `#F2F2F7` on the top of most screens, with slow clouds (A9).
- White speech bubbles with a 6 px corner on the side of the speaker (Safar's bubbles point to him, the user's voice bubble is blue).
- Status words stay in Geist Mono split-flap (A4). Colored soft tiles only for statuses (green ok, orange to do).
- Prices are never written by hand in the UI: `[TOTAL DU STORE]` in the mockups marks where the price store value goes.

## Build rules

- One component `src/components/bs/Safar.tsx`, pure SVG, no image, no video, no Lottie.
- Props: `state` (`"idle" | "listening" | "thinking" | "found" | "oops" | "bye"`), `size` (px, default 112), `tilt` (deg, default -12), `level` (0 to 1, voice volume, used by `listening`), `className`.
- Switching state crossfades the face (120 ms) and blends the body motion with a spring `{ type: "spring", duration: 0.5, bounce: 0.15 }`. Never snap.
- `prefers-reduced-motion`: mascot static in its state's pose, 200 ms fade on state change.
- Every state change that has a haptic calls `src/lib/haptics.ts` (which also fires the visual HapticRing).
- Colors only from the design tokens: body `blue` #0A6CFF, outline `ink` #0B0B0F, wings `card` #FFFFFF, sparkles `yellow` #FFC800, sweat drop `blue-soft` #EAF2FF.

## Geometry (viewBox 0 0 200 200, outline 7, round joins)

- Body: `M80,45 H120 A30,30 0 0 1 150,75 V105 A30,30 0 0 1 130,131 L140,160 Q118,156 108,135 H80 A30,30 0 0 1 50,105 V75 A30,30 0 0 1 80,45 Z`
- Left wing (drawn before the body): `M54,84 C42,78 24,76 12,82 C9,88 12,94 18,95 C14,100 17,106 25,106 C23,111 28,115 35,114 C42,113 49,108 54,104 Z`
- Right wing: the same path inside `translate(200,-10) scale(-1,1)`.
- Wings rotate around their attach point: `transform-box: fill-box; transform-origin: 100% 50%`.

## The 6 states

| State | Where in the app | Face | Motion (from `safar-states.html`) | Haptic |
|---|---|---|---|---|
| `idle` | Welcome, home | Happy closed eyes `M74,89 Q82,78 90,89` / `M108,89 Q116,78 124,89`, smile `M88,104 Q99,116 110,104` | Float: translateY 0 to -8 px and rotate -12 to -8 deg, 3.2 s ease-in-out loop. Wings: rotate 0 to -18 deg, 0.9 s loop. Blink: eyes scaleY to 0.15 at 94 % of a 4.5 s loop | none |
| `listening` | While recording (next to the radar A1) | Round eyes r 6.5 with white catchlights, open mouth ellipse 6 x 7 | Wings 0.26 s loop. Two blue sound arcs pulse opacity 0.15 to 1 (0.9 s, second arc +0.3 s); drive their opacity and scale with `level` | `start` when entering |
| `thinking` | Agent flight plan (A3) | Eyes looking up (dots at 88,80 and 122,80), flat mouth | Wings slow 2.4 s. Three blue dots above the head bounce -9 px, 1.2 s loop, staggered 0.15 s | none (the plan's `tick` haptics already fire) |
| `found` | Package ready, stamp landed (A8) | Happy eyes, open mouth filled, pink tongue | Jump: -22 px then squash scale(1.06, 0.94), 1.6 s. Three yellow 4-point sparkles twinkle scale 0.7 to 1.25 and rotate 25 deg, 1.4 s | `success` once on enter |
| `oops` | Mic denied, network down, switch to replay | Worried brows, dot eyes, wavy mouth, sweat drop | Shake: translateX ±4 px with small rotation, 2.2 s. Wings drooped (static rotate 18 deg, lowered 16 px) | `warn` once on enter |
| `bye` | Travel file, poster ("trik slama") | Wink: one closed eye, one dot eye, big smile | Fly loop: translate(-26, 14) to (18, -12) with rotate -18 to -6 deg, 3 s. Dotted trail behind: dasharray `0.1 15`, dashoffset 0 to -30 in 1.2 s linear | none |

## Welcome demo loop (10 s, `welcome-v2.html`)

All on `cubic-bezier(0.23, 1, 0.32, 1)`, looping every 10 s:

1. 0 to 6 %: the blue voice note slides up 12 px and scales 0.95 to 1. Its 12 waveform bars scale 0.3 to 1 in a 0.8 s loop with staggered negative delays.
2. 24 to 31 %: the transcript fades in.
3. 30 to 38 %: "Istanbul" and "nouss décembre" get a yellow highlight that grows left to right (background-size 0 to 100 %). In the app, reuse the A2 keyword component.
4. 40 to 48 %: the "BonSafar a compris" card rises 22 px and scales 0.94 to 1.
5. 46 to 52 %: the 3 chips pop in, staggered 0.15 s.
6. 90 to 100 %: everything fades out, then the loop restarts.

Also on screen: Safar in `idle`, clouds drifting left to right (38 s, 46 s, 56 s), a yellow sparkle twinkling (1.8 s), and a soft blue halo pulsing on the primary button (2.6 s). No amount of money appears in this demo.
