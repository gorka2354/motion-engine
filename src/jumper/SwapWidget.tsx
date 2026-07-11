// Pixel-faithful re-creation of jumper.xyz's "Swap & Bridge" widget (scouted from
// the live site 2026-07-11). Parametrized so a promo can animate the transfer:
// empty -> From/To filled -> amount typed -> route found. Real chain/token icons
// (LI.FI open icon set) live in public/jumper/.
import React from "react";
import { staticFile, Img } from "remotion";
import { theme } from "../theme";

const j = theme.jumper;
const FONT = "Inter, Manrope, system-ui, sans-serif";

export type Asset = {
  symbol: string;
  token: string; // public/jumper/tokens/*.png
  chain: string; // public/jumper/chains/*.svg
  chainName: string;
};

/** the assets used in the promo transfer + chain grid */
export const ASSETS: Record<string, Asset> = {
  eth: { symbol: "ETH", token: "jumper/tokens/eth.png", chain: "jumper/chains/ethereum.svg", chainName: "Ethereum" },
  usdc: { symbol: "USDC", token: "jumper/tokens/usdc.png", chain: "jumper/chains/arbitrum.svg", chainName: "Arbitrum" },
  usdt: { symbol: "USDT", token: "jumper/tokens/usdt.png", chain: "jumper/chains/optimism.svg", chainName: "Optimism" },
  btc: { symbol: "BTC", token: "jumper/tokens/btc.png", chain: "jumper/chains/bitcoin.svg", chainName: "Bitcoin" },
};

const GearIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={j.textMuted} strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ArrowIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? j.accent : j.textMuted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** token icon with a small chain badge bottom-right, exactly like Jumper */
const TokenIcon: React.FC<{ asset?: Asset; size?: number }> = ({ asset, size = 42 }) => {
  const badge = Math.round(size * 0.44);
  if (!asset)
    return (
      <div style={{ width: size, height: size, borderRadius: size, background: "#2C1D4A", border: `1px solid ${j.hair}` }} />
    );
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Img src={staticFile(asset.token)} width={size} height={size} style={{ borderRadius: size, display: "block" }} />
      <Img src={staticFile(asset.chain)} width={badge} height={badge}
        style={{ position: "absolute", right: -3, bottom: -3, borderRadius: badge, border: `2.5px solid ${j.card}`, background: "#0A0611", boxSizing: "content-box" }} />
    </div>
  );
};

const SubCard: React.FC<{ label: string; asset?: Asset }> = ({ label, asset }) => (
  // flex:1 + minWidth:0 so a wide "Select..." shrinks instead of overflowing the row
  // (min-width:auto is the flexbox default and won't shrink below content width);
  // overflow:hidden clips to the rounded card, ellipsis keeps the label tidy.
  <div style={{ flex: 1, minWidth: 0, background: j.cardInner, borderRadius: 16, padding: "14px 16px", minHeight: 96, boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: j.textMuted, marginBottom: 12 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <TokenIcon asset={asset} />
      <div style={{ fontSize: 21, fontWeight: 700, color: asset ? j.text : j.textMuted, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
        {asset ? asset.symbol : "Select..."}
      </div>
    </div>
  </div>
);

export const SwapWidget: React.FC<{
  from?: Asset;
  to?: Asset;
  amount?: string;
  usd?: string;
  ctaLabel?: string;
  ctaActive?: boolean; // route found -> CTA lights up
}> = ({ from, to, amount = "0", usd = "$0.00", ctaLabel = "Connect wallet", ctaActive = false }) => (
  <div
    style={{
      width: 360,
      background: j.card,
      borderRadius: 24,
      padding: 20,
      fontFamily: FONT,
      border: `1px solid ${j.hair}`,
      boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div style={{ fontSize: 25, fontWeight: 800, color: j.text, letterSpacing: "-0.02em" }}>Swap &amp; Bridge</div>
      <GearIcon />
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <SubCard label="From" asset={from} />
      <div style={{ flexShrink: 0, padding: "0 2px" }}><ArrowIcon active={!!(from && to)} /></div>
      <SubCard label="To" asset={to} />
    </div>

    <div style={{ background: j.cardInner, borderRadius: 16, padding: "14px 18px", marginTop: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: j.textMuted, marginBottom: 10 }}>Send</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <TokenIcon asset={from} size={38} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: amount !== "0" ? j.text : j.textMuted, lineHeight: 1 }}>{amount}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: j.textMuted, marginTop: 4 }}>{usd}</div>
        </div>
      </div>
    </div>

    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <div
        style={{
          flex: 1,
          height: 56,
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          fontWeight: 700,
          color: "#FCFAFF",
          background: ctaActive
            ? `linear-gradient(100deg, ${j.accent}, ${j.accentMid})`
            : j.accentDeep,
          boxShadow: ctaActive ? j.ctaGlow : "none",
        }}
      >
        {ctaLabel}
      </div>
      <div style={{ width: 56, height: 56, borderRadius: 100, background: j.cardInner, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={j.textMuted} strokeWidth="1.8">
          <rect x="3" y="6" width="18" height="13" rx="2.5" />
          <path d="M16 12h.5" />
        </svg>
      </div>
    </div>
  </div>
);
