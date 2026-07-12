import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { Counter } from "./Counter";
import { BarStat } from "./BarStat";
import { SplitCompare } from "./SplitCompare";

export const DATA_SANDBOX_DURATION = 150;

/**
 * Test bench for the category primitives (Counter / BarStat / SplitCompare) that open
 * the Data-Stats + Comparison video types. Dark stage, three stacked rows. Check
 * stills at ~40 (counter mid-roll, bars growing, split not yet started) and ~110
 * (all settled, split revealed at 50/50).
 */

const Row: React.FC<{ h: number; children: React.ReactNode; center?: boolean }> = ({
  h,
  children,
  center = true,
}) => (
  <div
    style={{
      position: "relative",
      height: h,
      overflow: "hidden",
      display: center ? "flex" : "block",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderBottom: `1px solid ${theme.dark.hair}`,
    }}
  >
    {children}
  </div>
);

const Panel: React.FC<{
  bg: string;
  title: string;
  lines: string[];
  tint: string;
  align: "left" | "right";
}> = ({ bg, title, lines, tint, align }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: bg,
      display: "flex",
      flexDirection: "column",
      // anchor content to its own half so it never collides on the seam (see SplitCompare doc)
      alignItems: align === "left" ? "flex-start" : "flex-end",
      justifyContent: "center",
      gap: 16,
      padding: "0 70px",
      textAlign: align,
      boxSizing: "border-box",
      fontFamily: theme.font.family,
    }}
  >
    <div style={{ fontSize: 40, fontWeight: 800, color: tint }}>{title}</div>
    {lines.map((l, i) => (
      <div key={i} style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
        {l}
      </div>
    ))}
  </div>
);

export const DataSandbox: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.dark.bg }}>
      {/* A — Counter / BAN */}
      <Row h={560}>
        <div style={{ fontFamily: theme.font.family, fontSize: 30, fontWeight: 700, color: theme.dark.textMuted, marginBottom: 18 }}>
          Volume bridged
        </div>
        <Counter to={1248000} prefix="$" startAt={6} dur={34} size={132} />
      </Row>

      {/* B — BarStat */}
      <Row h={640}>
        <BarStat
          at={20}
          rows={[
            { label: "Ethereum", value: 12.4 },
            { label: "Polygon", value: 3.2 },
            { label: "Arbitrum", value: 0.04, color: theme.color.green },
          ]}
          prefix="$"
          decimals={2}
          suffix=" fee"
        />
      </Row>

      {/* C — SplitCompare */}
      <Row h={720} center={false}>
        <SplitCompare
          at={64}
          labelLeft="Manual"
          labelRight="Jumper"
          accent={theme.color.primary}
          left={
            <Panel
              bg="linear-gradient(160deg,#2A2030,#151019)"
              title="Manual bridge"
              lines={["6 steps", "~45s", "$14.20 fee"]}
              tint="#C9B8D6"
              align="left"
            />
          }
          right={
            <Panel
              bg="linear-gradient(160deg,#12324F,#0B2138)"
              title="Jumper"
              lines={["1 tap", "~12s", "$0.04 fee"]}
              tint={theme.dark.accent}
              align="right"
            />
          }
        />
      </Row>
    </AbsoluteFill>
  );
};
