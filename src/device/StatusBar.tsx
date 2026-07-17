import React from "react";
import { theme } from "../theme";

/** iOS-style status bar drawn inside the phone screen (time + signal/wifi/battery). */
export const StatusBar: React.FC<{ time?: string }> = ({ time = "9:41" }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        paddingLeft: 40,
        paddingRight: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: theme.font.family,
          fontWeight: 700,
          fontSize: 20,
          color: theme.color.ink,
          letterSpacing: 0.2,
        }}
      >
        {time}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* signal */}
        <svg width="24" height="16" viewBox="0 0 24 16" fill={theme.color.ink}>
          <rect x="0" y="10" width="4" height="6" rx="1" />
          <rect x="6" y="7" width="4" height="9" rx="1" />
          <rect x="12" y="4" width="4" height="12" rx="1" />
          <rect x="18" y="1" width="4" height="15" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <path
            d="M11 15.2 1.2 5.4a13.8 13.8 0 0 1 19.6 0L11 15.2Z"
            fill={theme.color.ink}
            opacity="0.15"
          />
          <path
            d="M11 15.2 4.9 9.1a8.6 8.6 0 0 1 12.2 0L11 15.2Z"
            fill={theme.color.ink}
          />
        </svg>
        {/* battery */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div
            style={{
              width: 30,
              height: 15,
              borderRadius: 5,
              border: `1.6px solid ${theme.color.ink}`,
              padding: 2,
              opacity: 0.9,
            }}
          >
            <div
              style={{
                width: "78%",
                height: "100%",
                borderRadius: 2,
                background: theme.color.ink,
              }}
            />
          </div>
          <div
            style={{
              width: 2.5,
              height: 6,
              borderRadius: 2,
              background: theme.color.ink,
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
};
