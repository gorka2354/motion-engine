// Pixel-faithful "Exchange from" selector sheet (scouted from jumper.xyz). Slides up
// over the widget in the promo so the transfer reads as a REAL selection flow:
// tap From → this sheet → highlight a network → highlight a token → it lands in the field.
import React from "react";
import { staticFile, Img } from "remotion";
import { theme } from "../theme";

const j = theme.jumper;
const FONT = "Inter, Manrope, system-ui, sans-serif";

// real chain icons shown as the network filter row (visualizes the 66 chains)
const NETS = [
  "ethereum", "solana", "arbitrum", "base", "optimism",
  "avalanche", "bitcoin", "unichain", "tron",
];

type Tok = { sym: string; name: string; token: string; chain: string };
const TOKENS: Tok[] = [
  { sym: "USDT", name: "Tether USD", token: "jumper/tokens/usdt.png", chain: "jumper/chains/tron.svg" },
  { sym: "USDC", name: "USD Coin", token: "jumper/tokens/usdc.png", chain: "jumper/chains/arbitrum.svg" },
  { sym: "BTC", name: "Bitcoin", token: "jumper/tokens/btc.png", chain: "jumper/chains/bitcoin.svg" },
  { sym: "ETH", name: "Ethereum", token: "jumper/tokens/eth.png", chain: "jumper/chains/ethereum.svg" },
];

const MiniToken: React.FC<{ token: string; chain: string; size?: number }> = ({ token, chain, size = 46 }) => {
  const badge = Math.round(size * 0.42);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Img src={staticFile(token)} width={size} height={size} style={{ borderRadius: size, display: "block" }} />
      <Img src={staticFile(chain)} width={badge} height={badge}
        style={{ position: "absolute", right: -3, bottom: -3, borderRadius: badge, border: `2.5px solid #160D28`, background: "#0A0611", boxSizing: "content-box" }} />
    </div>
  );
};

export const SelectSheet: React.FC<{
  title?: string;
  highlightNet?: number; // index in NETS to ring (tap)
  highlightTok?: string; // token symbol to highlight (tap)
}> = ({ title = "Exchange from", highlightNet, highlightTok }) => (
  <div style={{ width: 360, background: "#160D28", borderRadius: 28, padding: "22px 20px 24px", fontFamily: FONT, border: `1px solid ${j.hair}`, boxShadow: "0 40px 90px rgba(0,0,0,0.6)", boxSizing: "border-box", overflow: "hidden" }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={j.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      <div style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 800, color: j.text, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ width: 24 }} />
    </div>

    {/* network filter row */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {NETS.map((n, i) => (
        <div key={n} style={{ width: 54, height: 54, borderRadius: 15, background: j.cardInner, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", border: i === highlightNet ? `2px solid ${j.accent}` : `1px solid ${j.hair}`, boxShadow: i === highlightNet ? `0 0 18px rgba(211,92,255,0.5)` : "none" }}>
          <Img src={staticFile(`jumper/chains/${n}.svg`)} width={30} height={30} style={{ borderRadius: 30 }} />
        </div>
      ))}
      <div style={{ width: 54, height: 54, borderRadius: 15, background: j.cardInner, border: `1px solid ${j.hair}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: j.textMuted }}>+58</div>
    </div>

    {/* search */}
    <div style={{ marginTop: 18, background: j.cardInner, borderRadius: 14, padding: "15px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={j.textMuted} strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 17, fontWeight: 500, color: j.textMuted }}>Search by token or address</span>
    </div>

    {/* token list */}
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
      {TOKENS.map((t) => {
        const on = t.sym === highlightTok;
        return (
          <div key={t.sym} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 12px", borderRadius: 14, background: on ? "rgba(211,92,255,0.12)" : "transparent", border: on ? "1px solid rgba(211,92,255,0.42)" : "1px solid transparent" }}>
            <MiniToken token={t.token} chain={t.chain} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: j.text }}>{t.sym}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: j.textMuted, marginTop: 2 }}>{t.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
