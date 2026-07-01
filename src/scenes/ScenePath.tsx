import React from "react";
import { PhoneStage } from "../components/PhoneStage";
import { PathScreen } from "../screens/PathScreen";

/** Scene 3 — Learning path: a guided journey, not a pile of videos. */
export const ScenePath: React.FC = () => {
  return (
    <PhoneStage caption="A path, not a pile of videos">
      <PathScreen />
    </PhoneStage>
  );
};
