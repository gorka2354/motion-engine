import React from "react";
import { theme } from "../theme";

type Tab = "home" | "library" | "tools";

const HomeIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <path d="M4 11l8-6 8 6M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BookIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <path d="M12 5.5C10 4 6.5 4 4.5 4.7V19c2-.7 5.5-.7 7.5.8 2-1.5 5.5-1.5 7.5-.8V4.7C17.5 4 14 4 12 5.5Zm0 0V19" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SparkPlusIcon: React.FC<{ c: string }> = ({ c }) => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.5v7M8.5 12h7" strokeLinecap="round" />
  </svg>
);

/**
 * Faithful floating bottom nav: a white pill where inactive tabs are icons only
 * and the active tab shows icon + label (as in the live app).
 */
export const BottomNav: React.FC<{ active: Tab }> = ({ active }) => {
  const items: { key: Tab; label: string; Icon: React.FC<{ c: string }> }[] = [
    { key: "home", label: "Home", Icon: HomeIcon },
    { key: "library", label: "Library", Icon: BookIcon },
    { key: "tools", label: "AI tools", Icon: SparkPlusIcon },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 26,
        right: 26,
        bottom: 28,
        height: 78,
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${theme.color.hair}`,
        borderRadius: theme.radius.pill,
        boxShadow: "0 18px 38px -16px rgba(9,46,92,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingLeft: 26,
        paddingRight: 26,
        zIndex: 30,
      }}
    >
      {items.map(({ key, label, Icon }) => {
        const on = key === active;
        const c = on ? theme.color.ink : "#9AA6B0";
        return (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Icon c={c} />
            {on ? (
              <span
                style={{
                  fontFamily: theme.font.family,
                  fontSize: 21,
                  fontWeight: 700,
                  color: c,
                }}
              >
                {label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
