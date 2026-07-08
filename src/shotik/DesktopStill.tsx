import React from "react";
import { DesktopScreen } from "./DesktopScreen";

/**
 * Static pre-capture desktop (1408×880) — rendered once to PNG and baked
 * into the 3D laptop's screen texture, so the intro dolly lands on the
 * exact image the 2D flow starts with (seamless match-cut).
 */
// far beyond frame 0, strictly increasing (kf requires monotonic keyframes)
export const DesktopStill: React.FC = () => (
  <DesktopScreen
    t={{
      select: 10000,
      toolbar: 10100,
      arrow: 10200,
      box: 10300,
      marker: 10400,
      ocr: 10500,
      claude: 10600,
      lift: 10700,
      paste: 10800,
      sent: 10900,
      reply: 11000,
      mcp: 11100,
    }}
  />
);
