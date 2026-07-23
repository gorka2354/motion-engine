import React from "react";

type IconName =
  | "blocks"
  | "folder"
  | "sun"
  | "clock"
  | "gear"
  | "min"
  | "max"
  | "close"
  | "plus"
  | "search"
  | "split"
  | "send"
  | "terminal"
  | "bolt"
  | "lock"
  | "code";

const P: Record<IconName, React.ReactNode> = {
  blocks: (
    <>
      <rect x="4" y="4" width="16" height="5" rx="1.5" />
      <rect x="4" y="11" width="16" height="3" rx="1" opacity="0.6" />
      <rect x="4" y="16" width="10" height="4" rx="1.5" />
    </>
  ),
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h7A1.5 1.5 0 0 1 19 9v8.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5l1.4 2.2 2.6-.5.6 2.6 2.3 1.3-1 2.4 1 2.4-2.3 1.3-.6 2.6-2.6-.5L12 20.5l-1.4-2.2-2.6.5-.6-2.6-2.3-1.3 1-2.4-1-2.4 2.3-1.3.6-2.6 2.6.5z" />
    </>
  ),
  min: <path d="M5 12h14" />,
  max: <rect x="6" y="6" width="12" height="12" rx="1" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  split: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M12 5v14" />
    </>
  ),
  send: <path d="M4 12l16-7-7 16-2.5-6.5z" />,
  terminal: (
    <>
      <path d="M5 7l4 4-4 4M12 16h7" />
    </>
  ),
  bolt: <path d="M13 3L5 13h6l-1 8 8-11h-6z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
};

const FILLED: Partial<Record<IconName, boolean>> = { blocks: true, folder: true, send: true, bolt: true, max: false };

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}> = ({ name, size = 18, color = "currentColor", strokeWidth = 1.7, style }) => {
  const filled = FILLED[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden
    >
      {P[name]}
    </svg>
  );
};

/** The small shell badge (PS / PWSH) — a coloured pixel monogram chip. */
export const ShellBadge: React.FC<{ label?: string; color?: string; size?: number }> = ({
  label = "PS",
  color = "#5b8cf0",
  size = 16,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: size,
      height: size,
      padding: "0 3px",
      borderRadius: 3,
      background: `${color}22`,
      border: `1px solid ${color}66`,
      color,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: size * 0.62,
      fontWeight: 700,
      letterSpacing: 0.5,
    }}
  >
    {label}
  </span>
);

/** Red constructivist diamond bullet (◆) used before section titles. */
export const Diamond: React.FC<{ size?: number; color?: string }> = ({ size = 8, color = "#e2231a" }) => (
  <span
    style={{
      width: size,
      height: size,
      background: color,
      display: "inline-block",
      transform: "rotate(45deg)",
      flexShrink: 0,
    }}
  />
);
