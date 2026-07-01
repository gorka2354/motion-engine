import React from "react";
import { PhoneStage } from "../components/PhoneStage";
import { ProfileScreen } from "../screens/ProfileScreen";

/** Scene 2 — Personalization: the AI profile built around the user's goal. */
export const SceneProfile: React.FC = () => {
  return (
    <PhoneStage caption="A plan built around your goal">
      <ProfileScreen />
    </PhoneStage>
  );
};
