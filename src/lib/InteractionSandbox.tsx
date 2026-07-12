import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SPRING } from "../v2/anim";
import { Cursor } from "./Cursor";
import { TapPulse } from "./TapPulse";
import { Spotlight } from "./Spotlight";

export const INTERACTION_SANDBOX_DURATION = 150;

/**
 * Test bench for the interaction primitives (Cursor / TapPulse / Spotlight).
 * A mock product screen: cursor travels in and taps the primary button while a
 * Spotlight dims everything else, and the button presses on tap. Check stills at
 * ~8 (spotlight in, cursor entering) / 32 (arrived) / 42 (tapped + pressed) / 90
 * (settled). The mid-travel + tap frames are the ones to eyeball — a settled still
 * hides whether the cursor/tap/press stay in sync (footgun #5).
 */

// Target primary button center (composition px).
const BTN = { x: 540, y: 1120, w: 640, h: 132 };
const BTN_CX = BTN.x;
const BTN_CY = BTN.y;

const TAP = 40; // tap frame — cursor arrives at 32, taps ~8f later

const Card: React.FC<{
  top: number;
  h: number;
  children?: React.ReactNode;
}> = ({ top, h, children }) => (
  <div
    style={{
      position: "absolute",
      left: 120,
      top,
      width: 840,
      height: h,
      borderRadius: 28,
      background: theme.jumper.card,
      border: `1px solid ${theme.dark.hair}`,
      boxShadow: theme.dark.shadowFloat,
      fontFamily: theme.font.family,
      padding: 32,
      boxSizing: "border-box",
    }}
  >
    {children}
  </div>
);

export const InteractionSandbox: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // press-scale on the target — one spring fired at TAP (down then back).
  const pressIn = spring({ frame: f - TAP, fps, config: SPRING.pop, durationInFrames: 6 });
  const pressOut = spring({ frame: f - (TAP + 6), fps, config: SPRING.smooth, durationInFrames: 10 });
  const pressScale = 1 - 0.06 * pressIn + 0.06 * pressOut;

  return (
    <AbsoluteFill style={{ background: theme.jumper.bg }}>
      {/* mock screen chrome */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 150,
          fontFamily: theme.font.family,
          fontSize: 40,
          fontWeight: 800,
          color: theme.dark.text,
          letterSpacing: -0.5,
        }}
      >
        Confirm transfer
      </div>

      <Card top={260} h={200}>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.dark.textMuted }}>You send</div>
        <div style={{ fontSize: 52, fontWeight: 800, color: theme.dark.text, marginTop: 14 }}>
          1,250 USDC
        </div>
      </Card>
      <Card top={500} h={200}>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.dark.textMuted }}>You receive</div>
        <div style={{ fontSize: 52, fontWeight: 800, color: theme.dark.text, marginTop: 14 }}>
          1,248.6 USDT
        </div>
      </Card>
      <Card top={740} h={280}>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.dark.textMuted }}>Route</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: theme.dark.text, marginTop: 18 }}>
          Arbitrum → Optimism
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: theme.dark.textMuted, marginTop: 12 }}>
          ~12s · $0.04 fee
        </div>
      </Card>

      {/* the target primary button */}
      <div
        style={{
          position: "absolute",
          left: BTN.x - BTN.w / 2,
          top: BTN.y - BTN.h / 2,
          width: BTN.w,
          height: BTN.h,
          transform: `scale(${pressScale})`,
          borderRadius: theme.radius.pill,
          background: theme.jumper.accent,
          boxShadow: theme.jumper.ctaGlow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font.family,
          fontSize: 40,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        Send transfer
      </div>

      {/* focus the eye on the button — dims the three cards above */}
      <Spotlight
        cx={BTN_CX}
        cy={BTN_CY}
        radius={430}
        softness={340}
        intensity={0.6}
        enterAt={2}
        enterDur={12}
        exitAt={112}
        exitDur={16}
      />

      {/* tap indicator — fires after the cursor arrives, above the spotlight.
          White here: an accent ripple on the accent button would be invisible. */}
      <TapPulse at={TAP} x={BTN_CX + 70} y={BTN_CY + 26} size={56} color="#ffffff" />

      {/* traveling cursor — arrives (14+18=32) ~8f before the tap. Aimed just below
          the label (touch-like) and white, so it reads on the magenta CTA. */}
      <Cursor
        from={[300, 1620]}
        to={[BTN_CX + 70, BTN_CY + 26]}
        moveStart={14}
        moveDur={18}
        hideAfter={72}
        color="#ffffff"
      />
    </AbsoluteFill>
  );
};
