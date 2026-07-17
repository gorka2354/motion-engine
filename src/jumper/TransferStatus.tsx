// Transfer execution — the card the widget morphs into after "Review route" is tapped,
// closing the arc intent → action → RESULT. Modeled on the LI.FI/Jumper bridging flow
// (route steps that check off, then a success state). progress 0→1 advances the steps;
// done flips to the "Transfer complete" celebration. Same 360 card as the widget so it
// reads as the same surface continuing.
import React from "react";
import { staticFile, Img } from "remotion";
import { theme } from "../theme";
import type { Asset } from "./SwapWidget";

const j = theme.jumper;
const FONT = "Inter, Manrope, system-ui, sans-serif";

const Check: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const TokenDot: React.FC<{ asset: Asset; size?: number }> = ({ asset, size = 34 }) => {
  const badge = Math.round(size * 0.46);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Img src={staticFile(asset.token)} width={size} height={size} style={{ borderRadius: size, display: "block" }} />
      <Img src={staticFile(asset.chain)} width={badge} height={badge}
        style={{ position: "absolute", right: -3, bottom: -3, borderRadius: badge, border: `2px solid ${j.card}`, background: "#0A0611", boxSizing: "content-box" }} />
    </div>
  );
};

const STEPS = ["Confirm transfer", "Bridging via Relay", `Receive on`]; // last gets the chain name

export const TransferStatus: React.FC<{
  from: Asset;
  to: Asset;
  received: string; // e.g. "1,842.6 USDC"
  progress: number; // 0-1 while bridging
  done: boolean; // switch to the complete celebration
  pop?: number; // 0-1 entrance scale of the success check
}> = ({ from, to, received, progress, done, pop = 1 }) => {
  const thresholds = [0.12, 0.58, 0.98];
  return (
    <div style={{ width: 360, background: j.card, borderRadius: 24, padding: 22, fontFamily: FONT, border: `1px solid ${j.hair}`, boxShadow: "0 30px 70px rgba(0,0,0,0.55)", boxSizing: "border-box" }}>
      {done ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0 10px" }}>
          <div style={{ width: 92, height: 92, borderRadius: 92, background: `linear-gradient(140deg, ${j.accent}, ${j.accentMid})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: j.ctaGlow, transform: `scale(${pop})` }}>
            <Check size={48} />
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: j.text, marginTop: 22, letterSpacing: "-0.02em" }}>Transfer complete</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <TokenDot asset={to} size={30} />
            <span style={{ fontSize: 24, fontWeight: 800, color: j.accent }}>+{received}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: j.textMuted, marginTop: 10 }}>on {to.chainName} · 1 tx · ~12s</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <TokenDot asset={from} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={j.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <TokenDot asset={to} />
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: j.text }}>Bridging</div>
          </div>

          {/* progress bar */}
          <div style={{ height: 8, borderRadius: 8, background: j.cardInner, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 8, background: `linear-gradient(90deg, ${j.accent}, ${j.accentMid})` }} />
          </div>

          {/* steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEPS.map((s, i) => {
              const stepDone = progress >= thresholds[i];
              const active = !stepDone && (i === 0 || progress >= thresholds[i - 1]);
              const label = i === 2 ? `${s} ${to.chainName}` : s;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: stepDone ? j.accent : "transparent", border: stepDone ? "none" : `2px solid ${active ? j.accent : j.hair}`, boxShadow: active ? `0 0 14px rgba(211,92,255,0.5)` : "none" }}>
                    {stepDone ? <Check size={16} /> : <div style={{ width: 8, height: 8, borderRadius: 8, background: active ? j.accent : j.textMuted }} />}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: stepDone || active ? 700 : 600, color: stepDone ? j.text : active ? j.text : j.textMuted }}>{label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
