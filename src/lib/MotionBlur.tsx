import React from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";

/**
 * Camera-style motion blur for anything that moves with the rig.
 * shutterAngle 180 ≈ filmic; push toward 300+ for smearier trails.
 * The subtree renders `samples` times per frame — keep it on moving
 * content only, not on static full-screen layers.
 */
export const MotionBlur: React.FC<{
  children: React.ReactNode;
  shutterAngle?: number;
  samples?: number;
}> = ({ children, shutterAngle = 180, samples = 10 }) => (
  <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
    {children}
  </CameraMotionBlur>
);
