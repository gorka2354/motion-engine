import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { clamp01, EASE, EASE_INOUT } from "./anim";

export type FlowStep = {
  /** Global frame at which this screen starts entering. First step uses 0. */
  at: number;
  /** How this screen enters: iOS push, tab crossfade, or a 3D card flip. */
  kind: "push" | "tab" | "flip";
  node: React.ReactNode;
};

const PUSH_D = 20;
const TAB_D = 16;
const FLIP_D = 22;

const durOf = (k: FlowStep["kind"]) =>
  k === "tab" ? TAB_D : k === "flip" ? FLIP_D : PUSH_D;

/**
 * In-device navigation. Screens transition like a real app — an iOS push
 * (incoming slides from the right while the outgoing screen shifts left and
 * dims) or a tab switch (soft crossfade + micro-scale). Each screen mounts in
 * its own Sequence so its internal animations start when it appears.
 */
export const ScreenFlow: React.FC<{ steps: FlowStep[] }> = ({ steps }) => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {steps.map((st, i) => {
        const next = steps[i + 1];
        const dur = next ? durOf(next.kind) : PUSH_D;
        const start = st.at;
        const end = next ? next.at + dur : Number.POSITIVE_INFINITY;
        if (f < start - 1 || f > end + 1) return null;

        // enter progress of this screen
        const inDur = durOf(st.kind);
        const pInRaw = i === 0 ? 1 : clamp01((f - st.at) / inDur);
        const pIn = EASE(pInRaw);
        // exit progress (as the next screen comes in)
        const pOutRaw = next ? clamp01((f - next.at) / dur) : 0;
        const pOut = EASE_INOUT(pOutRaw);

        // compose enter + exit into one transform (they can overlap)
        let tx = 0;
        let opacity = 1;
        let scale = 1;
        let rotY = 0;
        if (i > 0 && st.kind === "push") tx += (1 - pIn) * 100;
        if (i > 0 && st.kind === "tab") {
          opacity *= pIn;
          scale = 0.985 + 0.015 * pIn;
        }
        if (i > 0 && st.kind === "flip") {
          rotY = (1 - pIn) * 85;
          opacity *= Math.pow(pInRaw, 1.5);
        }
        if (next?.kind === "push") tx += -26 * pOut;
        if (next?.kind === "tab") opacity *= 1 - pOut;
        if (next?.kind === "flip") {
          rotY = -85 * pOut;
          opacity *= Math.pow(1 - pOutRaw, 1.2);
        }

        const entering = i > 0 && st.kind === "push" && pInRaw < 1;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: i,
              overflow: "hidden",
              translate: `${tx}% 0`,
              opacity,
              scale: String(scale),
              transform:
                rotY !== 0
                  ? `perspective(1200px) rotateY(${rotY}deg)`
                  : undefined,
              boxShadow: entering
                ? `-28px 0 56px rgba(3,20,35,${0.14 * (1 - pIn)})`
                : undefined,
            }}
          >
            <Sequence from={st.at}>{st.node}</Sequence>
            {/* dim the underlying screen during a push, like iOS */}
            {next?.kind === "push" && pOut > 0 ? (
              <AbsoluteFill
                style={{ backgroundColor: "rgba(3,20,35,0.10)", opacity: pOut }}
              />
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
