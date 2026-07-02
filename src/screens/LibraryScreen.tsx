import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BottomNav } from "../components/BottomNav";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

const TRACKS = [
  { label: "Careers", icon: "library/track-careers.png", active: true },
  { label: "Challenges", icon: "library/track-challenges.png" },
  { label: "Images", icon: "library/track-images.png" },
  { label: "Video", icon: "library/track-videos.png" },
];

const CAREERS = [
  { title: "AI for Accountants", icon: "library/career-accountants.png" },
  { title: "AI for Project Managers", icon: "library/career-pm.png" },
  { title: "AI for Sales Managers", icon: "library/career-sales.png" },
];

/**
 * The Library tab, faithful to the app: challenge hero (with the next course
 * card peeking), learning-path tracks with real icons, career courses. The
 * content auto-scrolls gently to reveal the careers list.
 */
export const LibraryScreen: React.FC = () => {
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
              background: "linear-gradient(180deg, #A8CFF7 0%, #E4F0FD 78%, #FDFEFF 100%)",
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
            <div style={{ fontSize: 31, fontWeight: 800, color: "#2E3A42", lineHeight: 1.18, marginTop: 14 }}>
              Your Personal AI
              <br />
              Income Challenge
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
            <div style={{ fontSize: 17, fontWeight: 600, color: "#5E7183", marginTop: 8 }}>3% complete</div>
            <div
              style={{
                marginTop: 16,
                height: 62,
                borderRadius: 16,
                background: "#fff",
                boxShadow: "0 10px 22px -10px rgba(9,46,92,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 21,
                fontWeight: 800,
                color: theme.color.ink,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={theme.color.ink}>
                <path d="M8 5.5v13l11-6.5L8 5.5Z" />
              </svg>
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
                background: "#E7F7F0",
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

        {/* learning paths */}
        <div style={{ padding: "34px 30px 0", opacity: rise(16), translate: `0 ${(1 - rise(16)) * 18}px` }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink }}>Learning paths</div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {TRACKS.map((t, i) => (
              <div key={t.label} style={{ flex: 1, opacity: rise(22 + i * 4), translate: `0 ${(1 - rise(22 + i * 4)) * 14}px` }}>
                <div
                  style={{
                    height: 96,
                    borderRadius: 18,
                    border: t.active ? `2px solid ${theme.color.primary}` : `1px solid ${theme.color.hair}`,
                    background: t.active ? "#EAF3FE" : theme.color.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Img src={staticFile(t.icon)} style={{ width: 56, height: 56, objectFit: "contain" }} />
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
                <Img src={staticFile(c.icon)} style={{ width: 58, height: 58, objectFit: "contain" }} />
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
