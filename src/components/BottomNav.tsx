import React from "react";
import { theme } from "../theme";

type Tab = "home" | "library" | "tools";

const HomeIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.1">
    <path d="M4 11l8-6 8 6M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BookIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.1">
    <path d="M12 5.5C10 4 6.5 4 4.5 4.7V19c2-.7 5.5-.7 7.5.8 2-1.5 5.5-1.5 7.5-.8V4.7C17.5 4 14 4 12 5.5Zm0 0V19" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SparkIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={c}>
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3L12 3Z" />
    <circle cx="18.5" cy="16.5" r="1.7" />
  </svg>
);

/** Floating bottom navigation pill (Home / Library / AI tools). */
export const BottomNav: React.FC<{ active: Tab }> = ({ active }) => {
  const items: { key: Tab; label: string; Icon: React.FC<{ c: string }> }[] = [
    { key: "home", label: "Home", Icon: HomeIcon },
    { key: "library", label: "Library", Icon: BookIcon },
    { key: "tools", label: "AI tools", Icon: SparkIcon },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 26,
        height: 74,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${theme.color.hair}`,
        borderRadius: theme.radius.pill,
        boxShadow: "0 16px 34px -16px rgba(9,46,92,0.30)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 30,
      }}
    >
      {items.map(({ key, label, Icon }) => {
        const on = key === active;
        const c = on ? theme.color.primary : theme.color.muted;
        return (
          <div
            key={key}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Icon c={c} />
            <span
              style={{
                fontFamily: theme.font.family,
                fontSize: 15,
                fontWeight: on ? 700 : 600,
                color: c,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
