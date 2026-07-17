import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../../theme";
import { BottomNav } from "../../components/BottomNav";
import { Icon, TintTile, type IconName } from "../LumoArt";

const L = theme.lumo;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

const TRACKS: { label: string; icon: IconName; active?: boolean }[] = [
  { label: "Skills", icon: "layers", active: true },
  { label: "Challenges", icon: "trophy" },
  { label: "Images", icon: "image" },
  { label: "Video", icon: "video" },
];

const CAREERS: { title: string; icon: IconName }[] = [
  { title: "AI for Marketers", icon: "megaphone" },
  { title: "AI for Writers", icon: "pen" },
  { title: "AI for Founders", icon: "rocket" },
];

/**
 * Lumo Library tab: challenge hero (with the next course peeking), learning
 * tracks, career courses. Gently auto-scrolls to reveal the careers list.
 */
export const LumoLibrary: React.FC = () => {
  const f = useCurrentFrame();

  const scroll = interpolate(f, [46, 128], [0, -470], {
    easing: EASE_INOUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = (from: number) =>
    interpolate(f, [from, from + 16], [0, 1], {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const challengeBar = interpolate(f, [18, 52], [0, 0.03], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.color.surface, fontFamily: theme.font.stack, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, translate: `0 ${scroll}px`, padding: "78px 0 0" }}>
        {/* hero carousel: challenge + peeking course */}
        <div style={{ display: "flex", gap: 14, paddingLeft: 30, opacity: rise(4), translate: `0 ${(1 - rise(4)) * 18}px` }}>
          <div
            style={{
              flexShrink: 0,
              width: 470,
              borderRadius: theme.radius.card,
              border: `1px solid ${theme.color.hair}`,
              background: "linear-gradient(180deg, #FFC3CF 0%, #FFE6EB 78%, #FFFDFE 100%)",
              padding: 24,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "#fff",
                borderRadius: 999,
                padding: "8px 18px",
                fontSize: 17,
                fontWeight: 700,
                color: theme.color.ink,
              }}
            >
              Challenges
            </div>
            <div style={{ fontSize: 31, fontWeight: 800, color: "#3A2A2E", lineHeight: 1.18, marginTop: 14 }}>
              Your 7-Day
              <br />
              AI Kickstart
            </div>
            <div style={{ marginTop: 18, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.7)" }}>
              <div
                style={{
                  width: `${Math.max(challengeBar * 100, 1.5)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: theme.color.green,
                }}
              />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#8A5E68", marginTop: 8 }}>3% complete</div>
            <div
              style={{
                marginTop: 16,
                height: 62,
                borderRadius: 16,
                background: "#fff",
                boxShadow: "0 10px 22px -10px rgba(120,40,60,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 21,
                fontWeight: 800,
                color: theme.color.ink,
              }}
            >
              <Icon name="play" size={16} color={theme.color.ink} />
              Continue
            </div>
          </div>

          {/* peeking next card (ChatGPT course) */}
          <div
            style={{
              flexShrink: 0,
              width: 220,
              borderRadius: theme.radius.card,
              border: `1px solid ${theme.color.hair}`,
              background: theme.color.surface,
              boxShadow: theme.color.softShadow,
              padding: 22,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: theme.providerTint.openai,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Img src={staticFile("providers/openai.svg")} style={{ width: 32, height: 32 }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.color.ink, marginTop: 14 }}>ChatGPT</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: theme.color.muted, marginTop: 4 }}>25% complete</div>
          </div>
        </div>

        {/* learning tracks */}
        <div style={{ padding: "34px 30px 0", opacity: rise(16), translate: `0 ${(1 - rise(16)) * 18}px` }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink }}>Learning tracks</div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {TRACKS.map((t, i) => (
              <div key={t.label} style={{ flex: 1, opacity: rise(22 + i * 4), translate: `0 ${(1 - rise(22 + i * 4)) * 14}px` }}>
                <div
                  style={{
                    height: 96,
                    borderRadius: 18,
                    border: t.active ? `2px solid ${L.accentSolid}` : `1px solid ${theme.color.hair}`,
                    background: t.active ? L.tint : theme.color.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={t.icon} size={40} color={t.active ? L.accentDeep : theme.color.muted} strokeWidth={2.2} />
                </div>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 8,
                    fontSize: 17,
                    fontWeight: t.active ? 800 : 600,
                    color: t.active ? theme.color.ink : theme.color.muted,
                  }}
                >
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* careers */}
        <div style={{ padding: "34px 30px 0", opacity: rise(34), translate: `0 ${(1 - rise(34)) * 18}px` }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink }}>Careers</div>
          <div style={{ fontSize: 19, fontWeight: 500, color: theme.color.muted, marginTop: 4 }}>
            Learn AI for your profession
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {CAREERS.map((c, i) => (
              <div
                key={c.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  border: `1px solid ${theme.color.hair}`,
                  borderRadius: 20,
                  background: theme.color.surface,
                  padding: 18,
                  opacity: rise(42 + i * 6),
                  translate: `0 ${(1 - rise(42 + i * 6)) * 16}px`,
                }}
              >
                <TintTile icon={c.icon} size={58} />
                <div>
                  <div style={{ fontSize: 23, fontWeight: 800, color: theme.color.ink }}>{c.title}</div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: theme.color.muted, marginTop: 3 }}>
                    Not started
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="library" />
    </AbsoluteFill>
  );
};
