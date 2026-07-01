import React from "react";
import { PhoneStage } from "../components/PhoneStage";
import { AiToolsScreen } from "../screens/AiToolsScreen";

/** Scene 5 — AI tools hub: use every model in one place. */
export const SceneAiTools: React.FC = () => {
  return (
    <PhoneStage caption="Use every AI in one place">
      <AiToolsScreen />
    </PhoneStage>
  );
};
