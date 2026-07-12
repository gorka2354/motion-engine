import React from "react";
import { AbsoluteFill, useCurrentFrame, staticFile } from "remotion";
import { theme } from "../theme";
import { clamp01 } from "../v2/anim";
import { Music, Sfx, type SfxClip } from "./sound";
import type { DuckEvent } from "./sound";

export const SOUND_SANDBOX_DURATION = 130;

/**
 * Audio bench — plays the bed + one of each SFX on marked frames so the render can be
 * checked for a real audio track and a sane mix (I can't listen, so validation is
 * numeric: ffprobe = audio stream exists, loudnorm print = LUFS/true-peak). The visual
 * just flashes each event so a mid-frame still confirms which cue is firing.
 */

const EVENTS: { clip: SfxClip; at: number }[] = [
  { clip: "tap", at: 20 },
  { clip: "select", at: 42 },
  { clip: "confirm", at: 64 },
  { clip: "whoosh", at: 86 },
  { clip: "success", at: 108 },
];

const DUCK: DuckEvent[] = EVENTS.map((e) => ({
  at: e.at,
  depth: e.clip === "success" ? 0.6 : e.clip === "whoosh" ? 0.5 : 0.35,
}));

export const SoundSandbox: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.dark.bg, fontFamily: theme.font.family }}>
      {/* audio */}
      <Music src={staticFile("audio/bed.wav")} peak={0.2} fadeIn={16} fadeOut={24} duckAround={DUCK} />
      {EVENTS.map((e, i) => (
        <Sfx key={i} clip={e.clip} at={e.at} />
      ))}

      {/* visual event list — active cue flashes */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: theme.dark.text, marginBottom: 20 }}>Sound check</div>
        {EVENTS.map((e) => {
          const flash = clamp01(1 - (f - e.at) / 16);
          const on = f >= e.at && flash > 0;
          return (
            <div key={e.clip} style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: on ? theme.color.primary : theme.dark.hair,
                  boxShadow: on ? `0 0 ${18 * flash}px ${theme.color.primary}` : "none",
                  transform: `scale(${on ? 1 + flash * 0.6 : 1})`,
                }}
              />
              <div style={{ fontSize: 34, fontWeight: 700, color: on ? theme.dark.text : theme.dark.textMuted, width: 220 }}>
                {e.clip}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: theme.dark.textMuted, fontVariantNumeric: "tabular-nums" }}>
                f{e.at}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
