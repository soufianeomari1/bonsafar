# Motion spec: Safar mascot and welcome screen

This folder is the source of truth for the mascot and the welcome screen animations.
The two HTML files are **living references**: open them in a browser to watch every loop. Their CSS `@keyframes` give the exact timings, easings and transforms to reproduce in React with `motion/react`.

| File | What it shows |
|---|---|
| `welcome-v2.html` | Screen 0, the welcome screen, with its 10-second demo loop |
| `safar-states.html` | The 6 mascot states side by side |
| `safar.svg` | The mascot at rest, static (base geometry, app icon source) |

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
