// Pixel-faithful "Select a wallet" modal (scouted from jumper.xyz — real wallet list,
// order, badges and icons pulled from the live LI.FI/Jumper connect dialog). Slides up in
// the promo so the connect step reads as REAL: tap Connect wallet → this sheet → highlight
// MetaMask → it connects (address shows in the widget). Icons in public/jumper/wallets/.
import React from "react";
import { staticFile, Img } from "remotion";
import { theme } from "../theme";

const j = theme.jumper;
const FONT = "Inter, Manrope, system-ui, sans-serif";

type Wallet = { name: string; icon: string; badge: string };
const WALLETS: Wallet[] = [
  { name: "Slush", icon: "jumper/wallets/slush.svg", badge: "Installed" },
  { name: "Abstract", icon: "jumper/wallets/abstract.png", badge: "Installed" },
  { name: "WalletConnect", icon: "jumper/wallets/walletConnect.svg", badge: "QR Code" },
  { name: "MetaMask", icon: "jumper/wallets/metamask.svg", badge: "Get Started" },
  { name: "Coinbase Wallet", icon: "jumper/wallets/coinbase.svg", badge: "Get Started" },
  { name: "Base Account", icon: "jumper/wallets/baseAccount.svg", badge: "Get Started" },
];

export const ConnectSheet: React.FC<{
  highlight?: string; // wallet name to ring (the tap)
}> = ({ highlight }) => (
  <div style={{ width: 360, background: "#160D28", borderRadius: 28, padding: "22px 20px 24px", fontFamily: FONT, border: `1px solid ${j.hair}`, boxShadow: "0 40px 90px rgba(0,0,0,0.6)", boxSizing: "border-box", overflow: "hidden" }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
      <div style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 800, color: j.text, letterSpacing: "-0.02em", paddingLeft: 24 }}>Select a wallet</div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={j.textMuted} strokeWidth="2.2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </div>

    {/* wallet list */}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {WALLETS.map((w) => {
        const on = w.name === highlight;
        return (
          <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 16px", borderRadius: 16, background: on ? "rgba(211,92,255,0.12)" : j.cardInner, border: on ? `1px solid rgba(211,92,255,0.5)` : `1px solid ${j.hair}`, boxShadow: on ? `0 0 20px rgba(211,92,255,0.4)` : "none" }}>
            <Img src={staticFile(w.icon)} width={42} height={42} style={{ borderRadius: 12, display: "block", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 700, color: j.text, lineHeight: 1.15 }}>{w.name}</div>
            <div style={{ padding: "5px 11px", borderRadius: 100, background: "rgba(255,255,255,0.06)", border: `1px solid ${j.hair}`, fontSize: 13, fontWeight: 600, color: j.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>{w.badge}</div>
          </div>
        );
      })}
    </div>
  </div>
);
