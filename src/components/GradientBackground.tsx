import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

/**
 * Branded scene backdrop: the Tixu light-blue gradient with two soft,
 * blurred brand blobs for depth. The floating phone sits on top of this.
 */
export const GradientBackground: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #E8F2FE 0%, #F4F9FF 48%, #FFFFFF 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -180,
          left: -140,
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: theme.color.gradTop,
          filter: "blur(130px)",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 620,
          right: -240,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: theme.color.gradLavender,
          filter: "blur(140px)",
          opacity: 0.6,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
