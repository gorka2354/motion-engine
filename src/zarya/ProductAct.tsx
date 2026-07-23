import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Z, FONT, APP } from "./zarya.style";
import { clamp01 } from "../v2/anim";
import { Spotlight } from "../lib/Spotlight";
import { ZaryaWindow } from "./ui/ZaryaWindow";
import { TerminalContent, DEMO_BLOCKS, LINT_FIXED, PromptLine } from "./ui/TerminalContent";
import type { BlockData } from "./ui/Block";
import { Block } from "./ui/Block";
import { AgentReply } from "./ui/AgentReply";
import { ClaudeQuestionBar } from "./ui/ClaudeQuestionBar";
import { LaunchPad } from "./ui/LaunchPad";
import { HistoryOverlay } from "./ui/HistoryOverlay";
import { EditorMock } from "./ui/EditorMock";
import { RocketLaunch } from "./space/RocketLaunch";
import { PixelSunrise } from "./space/PixelRocket";
import { LAUNCH_TOTAL } from "./space/rocketMath";
import { Caption } from "./ui/Caption";
import { SessionsList } from "./ui/SessionsList";

/** ProductAct local timeline (frames @30fps) — single source for visuals + sound cues.
 *  Everything (shell commands AND Claude requests) is typed in the ONE unified bar. */
export const T = {
  boot: 0,
  // unified input → shell: each "$ …" typed in the bottom bar becomes a block
  type1: 44, cmd1: 80, // $ git status
  type2: 98, cmd2: 128, // $ git log
  type3: 144, cmd3: 176, // $ npm run lint (fails)
  navDown: 192, rerun: 216, // focus failed block → re-run (fail→pass demo)
  termCap: 44, termCapEnd: 250,
  // unified input → Claude Code (Warp core): the reply lands INLINE in the terminal
  askType: 258, // type the natural-language request in the SAME bar
  agentIn: 300, replyStart: 326, replyEnd: 376, patch: 384,
  // then the unified bar MORPHS into a native choice selector (the signature feature)
  qMorph: 426, qPick: 486, agentOut: 520,
  // пусковой комплекс
  lpIn: 536, pickOpus: 572, thrustUp: 602, toPusk: 640, pusk: 654,
  rocketStart: 654, // countdown+liftoff; ends rocketStart+LAUNCH_TOTAL = 792
  // hero: SHOWCASE many sessions across projects → shutdown → dawn → restore
  work: 798, glitch: 862, black: 867, darkHold: 872, dawn: 908, replay: 954, marker: 1044, fresh: 1072, heroHold: 1122,
  // feature montage (fast, accelerating) — a touch more read time per feature
  ideIn: 1144, ideOut: 1222, histIn: 1226, histOut: 1304, themeIn: 1308, themeOut: 1400,
  end: 1452,
} as const;

export const PRODUCT_DURATION = T.end;

const FINAL_BLOCKS: BlockData[] = [DEMO_BLOCKS[0], DEMO_BLOCKS[1], DEMO_BLOCKS[2], LINT_FIXED];

/** Options the agent offers when it asks a question — the bar morphs into these. */
const QUESTION_OPTIONS = [
  { label: "Применить и запустить линт", desc: "патч + npm run lint одним шагом" },
  { label: "Только применить патч", desc: "без запуска проверок" },
  { label: "Показать полный diff", desc: "развернуть изменения построчно" },
  { label: "Свой вариант (Other)", desc: "написать ответ вручную" },
];

const reveal = (f: number, a: number, b: number, text: string): string =>
  text.slice(0, Math.max(0, Math.round(interpolate(f, [a, b], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));

/** The persistent product act: the window is mounted once; content, overlays and
 *  the camera are all pure functions of the local frame. */
export const ProductAct: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();

  // ── camera: rise in (evoke liftoff), then hold still during reads ──
  // Landscape (16:9) is height-bound → ~0.934. Portrait (9:16) is width-bound →
  // the window fills the frame width and rides high, leaving a lower band for the
  // HUD captions. The 16:9 path is unchanged (Δ=0).
  const isPortrait = H > W;
  const enter = spring({ frame: f, fps, config: { damping: 26, stiffness: 90 } });
  const landscapeScale = 0.884 + enter * 0.05; // → ~0.934
  const portraitScale = ((W * 0.96) / APP.w) * (0.92 + enter * 0.04); // fills portrait width
  const pullOut = interpolate(f, [T.themeOut, T.end], [0, -0.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = (isPortrait ? portraitScale : landscapeScale) + pullOut;
  const riseY = (1 - enter) * 80 - 12 - (isPortrait ? H * 0.13 : 0); // portrait: seat the window high

  // ── terminal content state ──
  const blocks: BlockData[] = [];
  if (f >= T.cmd1) blocks.push(FINAL_BLOCKS[0]);
  if (f >= T.cmd2) blocks.push(FINAL_BLOCKS[1]);
  if (f >= T.cmd3) blocks.push(FINAL_BLOCKS[2]);
  if (f >= T.rerun) blocks.push(FINAL_BLOCKS[3]);

  // ── unified input: EVERYTHING is typed in the ONE bottom bar ──
  // "$ …" → shell (becomes a block); plain text (no $) → Claude Code.
  const CLAUDE_ASK = "Вынеси api-ключ в const и покажи патч";
  const barMode: "shell" | "claude" = f >= T.askType && f < T.lpIn ? "claude" : "shell";
  let barText = "";
  if (f >= T.type1 && f < T.cmd1) barText = "$ " + reveal(f, T.type1, T.cmd1 - 4, "git status");
  else if (f >= T.type2 && f < T.cmd2) barText = "$ " + reveal(f, T.type2, T.cmd2 - 4, "git log --oneline -5");
  else if (f >= T.type3 && f < T.cmd3) barText = "$ " + reveal(f, T.type3, T.cmd3 - 4, "npm run lint");
  else if (f >= T.askType && f < T.agentIn) barText = reveal(f, T.askType, T.agentIn - 4, CLAUDE_ASK);

  const focusedIndex = f >= T.navDown && f < T.rerun ? 2 : undefined;
  const rerunIndex = f >= T.rerun ? 3 : undefined;

  // ── hero replay override: during dawn/replay reveal blocks top-down ──
  let termBlocks = blocks;
  let showPrompt = f < T.agentIn; // TerminalContent isn't the main slot during [marker, ideIn)
  if (f >= T.black && f < T.marker) {
    const n = Math.floor(interpolate(f, [T.replay, T.marker - 8], [0, FINAL_BLOCKS.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    termBlocks = FINAL_BLOCKS.slice(0, n);
    showPrompt = false;
  } else if (f >= T.marker && f < T.ideIn) {
    termBlocks = FINAL_BLOCKS;
    showPrompt = false; // custom restore prompt rendered below
  }

  // ── agent beat: reply INLINE in the terminal (Warp core), then the unified bar
  //    MORPHS into a native choice selector ──
  const agentBeat = f >= T.agentIn && f < T.agentOut;
  const agentReveal = interpolate(f, [T.replyStart, T.replyEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qMorphing = f >= T.qMorph && f < T.agentOut;
  const qCursor = f < T.qMorph + 16 ? 2 : f < T.qMorph + 34 ? 1 : 0; // walks up to the recommended option

  // ── IDE-агент: a SIDE panel sliding from the right rail (a bonus, not the core) ──
  const ideBeat = f >= T.ideIn && f < T.ideOut;
  const ideSlide = clamp01(spring({ frame: f - T.ideIn, fps, config: { damping: 22, stiffness: 130 } }));
  const ideOut01 = interpolate(f, [T.ideOut - 14, T.ideOut], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ideX = (1 - ideSlide) * 100 + ideOut01 * 100;

  // ── launch pad state ──
  const lpActive = f >= T.lpIn && f < T.rocketStart;
  const lpIn = clamp01(spring({ frame: f - T.lpIn, fps, config: { damping: 20, stiffness: 140 } }));
  const selected = f >= T.pickOpus ? 1 : 0;
  const thrust = f < T.thrustUp ? 2 : Math.min(4, 2 + Math.floor(interpolate(f, [T.thrustUp, T.thrustUp + 24], [0, 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  // press during the run-up to launch and release exactly at liftoff — must sit
  // INSIDE the pad's live window [lpIn, rocketStart) or the depress never renders.
  const puskPressed = f >= T.toPusk && f < T.pusk;

  // ── rocket overlay ──
  const rf = f - T.rocketStart;
  const rocketOn = rf >= 0 && rf < LAUNCH_TOTAL;

  // ── shutdown / dawn hero ──
  // power-loss glitch then hard black; darkness hold; dawn bloom fades black away.
  const glitchFlash = f >= T.glitch && f < T.black ? (Math.floor(f) % 2 === 0 ? 0.9 : 0.35) : 0;
  const blackOpacity = interpolate(f, [T.glitch, T.black, T.darkHold, T.dawn, T.dawn + 44], [0, 1, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dawnBloom = interpolate(f, [T.dawn, T.dawn + 30, T.dawn + 70, T.replay + 40], [0, 0.9, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const emberDie = interpolate(f, [T.black, T.darkHold + 20], [0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dawnSun = interpolate(f, [T.dawn, T.dawn + 26, T.replay + 6, T.replay + 44], [0, 1, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dawnSunY = interpolate(f, [T.dawn, T.replay + 20], [56, -18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── theme morph: the whole window recolors live through 3 real Zarya themes.
  // A hue-rotate on the window recolors accents AND chrome uniformly (the app's
  // accents are one hue), which reads far stronger in a fast cut than a bg-only
  // var swap. Космос(red) → Орбита(teal) → Восток(warm) → back. ──
  let windowFilter = "none";
  if (f >= T.themeIn && f < T.themeIn + 28) windowFilter = "hue-rotate(158deg) saturate(1.2)"; // Орбита teal
  else if (f >= T.themeIn + 28 && f < T.themeIn + 56) windowFilter = "hue-rotate(-24deg) saturate(1.3) brightness(1.04)"; // Восток warm
  const themeFlash = [T.themeIn, T.themeIn + 28, T.themeIn + 56].some((t) => f >= t && f < t + 3) ? 0.22 : 0;

  const restoreCwd = "C:\\work\\zarya";

  return (
    <AbsoluteFill>
      {/* ── the persistent window ── */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${riseY}px) scale(${scale})`, filter: windowFilter }}>
          <ZaryaWindow
            sidebar={<SessionsList />}
            statusModel={f >= T.pickOpus ? "claude-opus-4-8" : "claude-sonnet-5"}
            cwd={f >= T.dawn ? restoreCwd : "C:\\Users\\pesto"}
            agent={{
              // the ONE unified bar: $ → shell, plain text → Claude Code
              bolt: barMode === "claude",
              mode: barMode === "claude" ? "CLAUDE CODE" : "ТЕРМИНАЛ",
              text: barText || undefined,
              caret: !!barText,
              // model chip mirrors the pad selection (SONNET until opus is picked)
              model: f >= T.lpIn && f < T.rocketStart ? (f >= T.pickOpus ? "OPUS 4.8" : "SONNET 5") : undefined,
              effort: f >= T.lpIn && f < T.rocketStart ? thrust : undefined,
              placeholder:
                barMode === "claude"
                  ? "Спросить Claude Code…  (Enter)"
                  : "Команда терминала…  (Enter — выполнить)",
            }}
            main={
              f >= T.marker && f < T.ideIn ? (
                <RestoredTerminal cwd={restoreCwd} f={f} />
              ) : agentBeat ? (
                // Warp core: the agent answers INLINE in the terminal
                <TerminalContent
                  blocks={FINAL_BLOCKS}
                  showBoot={false}
                  pinBottom
                  afterBlocks={<AgentReply query={CLAUDE_ASK} reveal={agentReveal} showPatch={f >= T.patch} />}
                  prompt={null}
                />
              ) : (
                <TerminalContent
                  blocks={termBlocks}
                  showBoot={f < T.black || f >= T.dawn}
                  focusedIndex={focusedIndex}
                  rerunIndex={rerunIndex}
                  prompt={showPrompt ? { typed: "", caret: true } : null}
                />
              )
            }
            overlay={
              // IDE-агент is a SIDE panel sliding from the right rail — a bonus, not the core
              ideBeat ? (
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "60%", transform: `translateX(${ideX}%)`, boxShadow: "-26px 0 54px rgba(0,0,0,0.55)" }}>
                  <EditorMock />
                </div>
              ) : null
            }
            bottomBar={
              // the signature morph: the unified bar becomes a native choice selector
              qMorphing ? (
                <div style={{ padding: "8px 10px" }}>
                  <ClaudeQuestionBar question="Применить патч к aiProxy.ts?" badge="ВЫБОР АГЕНТА" cursor={qCursor} options={QUESTION_OPTIONS} />
                </div>
              ) : undefined
            }
          />
        </div>
      </AbsoluteFill>

      {/* ── full-frame overlays ── */}
      {/* launch pad — signature moment, centered with scrim + spotlight */}
      {lpActive && (
        <AbsoluteFill style={{ opacity: lpIn }}>
          <AbsoluteFill style={{ background: "rgba(3,5,12,0.55)" }} />
          <Spotlight cx={W / 2} cy={H / 2} radius={520} softness={340} intensity={0.4} enterAt={T.lpIn} enterDur={16} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `scale(${1.7 * (0.96 + lpIn * 0.04)})`, filter: "drop-shadow(0 30px 70px rgba(0,0,0,0.6))" }}>
              <LaunchPad selected={selected} thrust={thrust} pressed={puskPressed} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* rocket launch */}
      {rocketOn && <RocketLaunch f={rf} model="CLAUDE-OPUS-4-8" thrust="МАКС" />}

      {/* history palette (Хроника) */}
      {f >= T.histIn && f < T.histOut && (
        <AbsoluteFill style={{ opacity: clamp01(spring({ frame: f - T.histIn, fps, config: { damping: 22, stiffness: 140 } })) }}>
          <HistoryOverlay query="git " selected={2} />
        </AbsoluteFill>
      )}

      {/* shutdown black + power glitch */}
      {glitchFlash > 0 && <AbsoluteFill style={{ background: "#fdf4e6", opacity: glitchFlash, mixBlendMode: "screen" }} />}
      {blackOpacity > 0.001 && (
        <AbsoluteFill style={{ background: "#02030a", opacity: blackOpacity }}>
          {/* dying ember / last cursor blink in the dark */}
          {emberDie > 0.01 && (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 10, background: Z.accent, opacity: emberDie * (Math.floor(f / 6) % 2 === 0 ? 1 : 0.3), boxShadow: `0 0 24px ${Z.accent}` }} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
      {/* dawn bloom — the sunrise that powers Zarya back */}
      {dawnBloom > 0.001 && (
        <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 108%, rgba(240,102,46,${0.5 * dawnBloom}), rgba(226,35,26,${0.28 * dawnBloom}) 34%, rgba(224,177,90,${0.16 * dawnBloom}) 56%, transparent 74%)`, pointerEvents: "none" }} />
      )}
      {/* pixel «Заря» sunrise literally rising as the machine powers back */}
      {dawnSun > 0.01 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ opacity: dawnSun, transform: `translateY(${dawnSunY}px)`, filter: "drop-shadow(0 0 44px rgba(240,102,46,0.5))" }}>
            <PixelSunrise size={isPortrait ? 150 : 190} glow />
          </div>
        </AbsoluteFill>
      )}
      {/* theme-swap flash */}
      {themeFlash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: themeFlash, mixBlendMode: "overlay" }} />}

      {/* lower-third HUD scrim — unifies the caption band and lifts it off the window chrome */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 210,
          background: "linear-gradient(180deg, transparent 0%, rgba(3,4,10,0.5) 45%, rgba(3,4,10,0.9) 100%)",
          pointerEvents: "none",
          // portrait seats captions on empty space below the window — no scrim needed
          opacity: isPortrait || (f >= T.black && f < T.dawn) ? 0 : 1,
        }}
      />

      {/* ── captions (mission-control HUD) — lingered + descriptive ── */}
      {/* shell-via-unified-bar → blocks */}
      <Caption from={T.type1 + 10} to={T.askType - 4} title="Единый ввод · каждая команда — блок" sub="$ → терминал · статус, время, повтор, экспорт в Markdown" />
      {/* Warp core: same bar, plain text → Claude Code, reply inline in the terminal */}
      <Caption from={T.agentIn + 10} to={T.qMorph} title="Ядро — Warp-среда для агента" sub="обычный текст → Claude Code · ответ прямо в терминале · свой ключ, локально" />
      {/* the signature morph */}
      <Caption from={T.qMorph + 8} to={T.agentOut} title="Строка сама становится выбором" sub="агент спрашивает — единый ввод морфится в опции · ↑↓, Enter — выбрать" />
      {/* launch pad */}
      <Caption from={T.lpIn + 10} to={T.pusk} title="Пусковой комплекс — выбор двигателя" sub="модель + ТЯГА (4 уровня) · ПУСК — и ракета взлетает" />
      {/* SHOWCASE: many sessions across projects, right before the shutdown */}
      <Caption from={T.work} to={T.glitch - 4} title="Много сессий. Разные проекты." sub="заря · api · landing · бот · ml — вся история под рукой" />
      {/* the hero payoff */}
      <Caption from={T.marker + 8} to={T.heroHold} title="Выключил ПК — а работа на месте" sub="все сессии пережили выключение · scrollback + блоки · тот же cwd, новый shell" />
      {/* features */}
      <Caption from={T.ideIn + 6} to={T.ideOut} title="Бонус — редактор сбоку (IDE-агент)" sub="Monaco из правого рейла · git-diff · клик по пути → строка · ядро остаётся терминалом" />
      <Caption from={T.histIn + 6} to={T.histOut} title="Хроника — вся история команд" sub="Ctrl+R · по всем сессиям и проектам · fuzzy-поиск" />
      <Caption from={T.themeIn + 6} to={T.themeOut} title="9 тем — перекраска на лету" sub="космос · орбита · восток · … всё на токенах темы" />
    </AbsoluteFill>
  );
};

/** The restored terminal: replayed blocks + the restore marker + a NEW live shell
 *  prompt in the saved cwd (fresh shell, not a resumed process). */
const RestoredTerminal: React.FC<{ cwd: string; f: number }> = ({ cwd, f }) => (
  <div style={{ padding: "16px 18px", height: "100%", overflow: "hidden" }}>
    {/* boot header stays across the marker swap so it doesn't blink out (review f) */}
    <div style={{ fontFamily: FONT.mono, fontSize: 13.5, lineHeight: 1.55, color: Z.termFg, marginBottom: 12 }}>
      <div>Windows PowerShell — Заря · Орбита-1</div>
      <div style={{ color: Z.fgFaint }}>Copyright (C) Microsoft Corporation. All rights reserved.</div>
    </div>
    {FINAL_BLOCKS.map((b, i) => (
      <Block key={i} data={b} dim={0.9} />
    ))}
    <div style={{ fontFamily: FONT.mono, fontSize: 13, color: Z.accent2, padding: "6px 0 8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
      <span>✦</span> сессия восстановлена · новый shell
    </div>
    {f >= T.fresh && <PromptLine typed="" caret cwd={cwd} />}
  </div>
);
