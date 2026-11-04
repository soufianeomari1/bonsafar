import { ImageResponse } from "next/og";

export const alt = "BonSafar, your travel agent that understands Moroccan darija: Safar and a CMN to IST boarding pass";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Design tokens (src/app/globals.css). Satori cannot read CSS variables. */
const C = {
  sky: "#dcebff",
  bg: "#f2f2f7",
  card: "#ffffff",
  ink: "#0b0b0f",
  muted: "#6b6b76",
  line: "#e5e5ea",
  blue: "#0a6cff",
  blueSoft: "#eaf2ff",
  yellow: "#ffc800",
  green: "#15803d",
  greenSoft: "#e8f7ee",
} as const;

const BODY =
  "M80,45 H120 A30,30 0 0 1 150,75 V105 A30,30 0 0 1 130,131 L140,160 Q118,156 108,135 H80 A30,30 0 0 1 50,105 V75 A30,30 0 0 1 80,45 Z";
const WING =
  "M54,84 C42,78 24,76 12,82 C9,88 12,94 18,95 C14,100 17,106 25,106 C23,111 28,115 35,114 C42,113 49,108 54,104 Z";
const CLOUD = "M20 30h52a12 12 0 0 0 0-24 16 16 0 0 0-30-4A14 14 0 0 0 20 30z";

const TITLE = "Your travel agent that understands Moroccan darija";

/** Geist from Google Fonts as TTF, the only format Satori reads. Falls back to the default font. */
async function geist(family: "Geist" | "Geist+Mono", weight: number, text: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

function Safar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <g transform="rotate(-12 100 100)">
        <path d={WING} fill={C.card} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        <g transform="translate(200,-10) scale(-1,1)">
          <path d={WING} fill={C.card} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        </g>
        <path d={BODY} fill={C.blue} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        <path d="M74,89 Q82,78 90,89 M108,89 Q116,78 124,89" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <path d="M86,101 Q99,124 112,101 Z" fill={C.ink} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <path
        d="M168,34 C170,41 172,43 179,45 C172,47 170,49 168,56 C166,49 164,47 157,45 C164,43 166,41 168,34 Z"
        fill={C.yellow}
        stroke={C.ink}
        strokeWidth={2.5}
      />
    </svg>
  );
}

function Cloud({ width, top, left, opacity }: { width: number; top: number; left: number; opacity: number }) {
  return (
    <svg
      width={width}
      height={(width * 34) / 90}
      viewBox="0 0 90 34"
      style={{ position: "absolute", top, left, opacity }}
    >
      <path d={CLOUD} fill={C.card} />
    </svg>
  );
}

function Airport({ code, city, align }: { code: string; city: string; align: "flex-start" | "flex-end" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align }}>
      <span style={{ fontFamily: "Geist Mono", fontSize: 76, fontWeight: 700, letterSpacing: -2, color: C.ink }}>
        {code}
      </span>
      <span style={{ fontFamily: "Geist Mono", fontSize: 18, letterSpacing: 3, color: C.muted }}>{city}</span>
    </div>
  );
}

export default async function Image() {
  const text = `BonSafar${TITLE}`;
  const mono = "CMNISTCASABLANCAISTANBULGATE1BOARDINGPASSNOVISANEEDED·→ ";
  const [bold, regular, monoBold, monoRegular] = await Promise.all([
    geist("Geist", 800, text),
    geist("Geist", 500, "Send a voice note in darija, get a real trip back."),
    geist("Geist+Mono", 700, mono),
    geist("Geist+Mono", 500, mono),
  ]);
  const fonts = [
    bold && { name: "Geist", data: bold, weight: 800 as const, style: "normal" as const },
    regular && { name: "Geist", data: regular, weight: 500 as const, style: "normal" as const },
    monoBold && { name: "Geist Mono", data: monoBold, weight: 700 as const, style: "normal" as const },
    monoRegular && { name: "Geist Mono", data: monoRegular, weight: 500 as const, style: "normal" as const },
  ].filter((font) => !!font);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundImage: `linear-gradient(180deg, ${C.sky} 0%, ${C.bg} 100%)`,
          fontFamily: "Geist",
          padding: "64px 72px",
        }}
      >
        <Cloud width={180} top={58} left={640} opacity={0.95} />
        <Cloud width={110} top={150} left={1010} opacity={0.8} />
        <Cloud width={90} top={548} left={1060} opacity={0.7} />

        <div style={{ display: "flex", flexDirection: "column", width: 560, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Safar size={64} />
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.6, color: C.ink, display: "flex" }}>
              Bon<span style={{ color: C.blue }}>Safar</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: C.ink }}>
              {TITLE}
            </span>
            <span style={{ fontSize: 24, fontWeight: 500, color: C.muted }}>
              Send a voice note in darija, get a real trip back.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, position: "relative" }}>
          <div style={{ display: "flex", position: "absolute", top: 2, right: 26 }}>
            <Safar size={150} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 470,
              marginTop: 120,
              background: C.card,
              borderRadius: 28,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 18px 48px rgba(10,108,255,0.14)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px 0" }}>
              <span style={{ fontFamily: "Geist Mono", fontSize: 16, fontWeight: 500, letterSpacing: 3, color: C.muted }}>
                BOARDING PASS
              </span>
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: C.yellow,
                  borderRadius: 9,
                  padding: "5px 12px",
                  fontFamily: "Geist Mono",
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                <span style={{ fontSize: 10, letterSpacing: 2 }}>GATE</span>
                <span style={{ fontSize: 22, lineHeight: 1 }}>1</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px 22px" }}>
              <Airport code="CMN" city="CASABLANCA" align="flex-start" />
              <svg width="110" height="40" viewBox="0 0 110 40">
                <path d="M4 30 Q55 -6 106 30" fill="none" stroke={C.blue} strokeWidth={4} strokeLinecap="round" strokeDasharray="0.1 12" />
                <circle cx="55" cy="12" r="7" fill={C.blue} stroke={C.ink} strokeWidth={2.5} />
              </svg>
              <Airport code="IST" city="ISTANBUL" align="flex-end" />
            </div>
            <div
              style={{
                display: "flex",
                borderTop: `2px dashed ${C.line}`,
                padding: "16px 28px 20px",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.greenSoft,
                  color: C.green,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontFamily: "Geist Mono",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 2,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: C.green }} />
                NO VISA NEEDED
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
