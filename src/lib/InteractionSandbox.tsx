import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { tapScale } from "../v2/anim";
import { TapTarget } from "./TapTarget";
import { Spotlight } from "./Spotlight";

export const INTERACTION_SANDBOX_DURATION = 150;

/**
 * Test bench for the interaction primitives (Cursor / TapPulse / Spotlight) as used
 * through the ergonomic layer: ONE <TapTarget> wires the cursor travel + ripple from
 * a single `at`, and tapScale() drives the button press from that same `at` (footgun
 * #5 by construction). A rect Spotlight dims the cards above the CTA. Check stills at
 * ~8 (spotlight in, cursor entering) / 32 (arrived) / 42 (tapped + pressed) / 90
 * (settled). Eyeball the travel + tap frames, not just settled ones.
 */

// Target primary button (composition px).
const BTN = { x: 540, y: 1120, w: 640, h: 132 };
const TAP = 40; // tap frame — everything derives from this

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

  // press-scale on the target — one helper, same `at` as the tap.
  const pressScale = tapScale(f, fps, TAP);

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

      {/* rect spotlight hugging the pill — dims the three cards above */}
      <Spotlight
        cx={BTN.x}
        cy={BTN.y}
        shape="rect"
        w={BTN.w + 130}
        h={BTN.h + 90}
        corner={BTN.h / 2 + 45}
        softness={210}
        intensity={0.58}
        enterAt={2}
        enterDur={12}
        exitAt={112}
        exitDur={16}
      />

      {/* one call = cursor travels in + ripple, synced. White so it reads on the
          magenta CTA; aimed just below the label (touch-like). Press is tapScale above. */}
      <TapTarget
        at={TAP}
        x={BTN.x + 70}
        y={BTN.y + 26}
        from={[300, 1620]}
        travel={18}
        color="#ffffff"
      />
    </AbsoluteFill>
  );
};
