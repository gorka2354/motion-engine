import React from "react";
import { Z, FONT } from "../zarya.style";
import { Icon, ShellBadge, Diamond } from "./icons";

/** A saved session across some project folder — mirrors the real SessionMeta
 *  fields the panel shows (title, cwd, shell, blocksCount, updated-relative). */
interface Sess {
  glyph: string; // shell monogram (PS / bash / zsh)
  color: string;
  title: string;
  cwd: string;
  blocks: number;
  when: string;
  fav?: boolean;
  active?: boolean; // currently open
}

const PS = "#5b8cf0";
const BASH = Z.termGreen;

/** Many sessions in different projects — the point of the hero: they all persist. */
export const SAVED_SESSIONS: Sess[] = [
  { glyph: "PS", color: PS, title: "заря · пусковой комплекс", cwd: "~\\zarya", blocks: 42, when: "2 мин", fav: true, active: true },
  { glyph: "PS", color: PS, title: "api · рефактор auth", cwd: "~\\work\\api", blocks: 27, when: "1 ч", fav: true },
  { glyph: "bash", color: BASH, title: "landing · hero-секция", cwd: "~\\web\\landing", blocks: 14, when: "3 ч" },
  { glyph: "PS", color: PS, title: "tg-бот · деплой", cwd: "~\\bots\\tg-bot", blocks: 23, when: "вчера" },
  { glyph: "bash", color: BASH, title: "ml · эксперименты", cwd: "~\\ml\\experiments", blocks: 8, when: "вчера" },
  { glyph: "PS", color: PS, title: "motion · рендер промо", cwd: "~\\motion-engine", blocks: 31, when: "2 дня" },
];

const Row: React.FC<{ s: Sess }> = ({ s }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 6,
      background: s.active ? "rgba(226,35,26,0.08)" : "transparent",
      border: `1px solid ${s.active ? "rgba(226,35,26,0.28)" : "transparent"}`,
    }}
  >
    <ShellBadge label={s.glyph} color={s.color} size={16} />
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: FONT.ui, fontSize: 13, color: s.active ? Z.fg : Z.fgDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.title}
        </span>
        {s.fav && <span style={{ color: Z.accent2, fontSize: 11 }}>★</span>}
        {s.active && (
          <span style={{ fontFamily: FONT.tech, fontSize: 9.5, letterSpacing: "0.06em", color: Z.success, border: `1px solid ${Z.success}66`, borderRadius: 3, padding: "0 4px" }}>
            открыта
          </span>
        )}
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 11, color: Z.fgFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
        {s.cwd} · {s.blocks} бл · {s.when}
      </div>
    </div>
  </div>
);

/**
 * The populated Sessions panel — many saved sessions across different project
 * folders (favorites first). This is what makes the persistence hero land: the
 * whole list is here before shutdown and unchanged after the machine powers back.
 */
export const SessionsList: React.FC<{ dim?: number }> = ({ dim = 1 }) => {
  const favs = SAVED_SESSIONS.filter((s) => s.fav);
  const rest = SAVED_SESSIONS.filter((s) => !s.fav);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 12px", height: "100%", opacity: dim }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Diamond size={7} />
        <span style={{ fontFamily: FONT.tech, fontSize: 15, letterSpacing: "0.14em", color: Z.accent2 }}>СЕССИИ</span>
        <span style={{ fontFamily: FONT.tech, fontSize: 11, letterSpacing: "0.12em", color: Z.fgFaint }}>{SAVED_SESSIONS.length} СОХРАНЕНО</span>
        <div style={{ flex: 1 }} />
        <Icon name="plus" size={15} color={Z.fgFaint} />
      </div>
      <div style={{ height: 32, borderRadius: 6, background: "var(--zy-bg1)", border: "1px solid var(--zy-border)", display: "flex", alignItems: "center", paddingLeft: 10, gap: 8, fontFamily: FONT.ui, fontSize: 12, color: Z.fgFaint }}>
        <Icon name="search" size={12} color={Z.fgFaint} /> Поиск сессий…
      </div>

      <div style={{ fontFamily: FONT.tech, fontSize: 11, letterSpacing: "0.14em", color: Z.fgFaint, marginTop: 2 }}>★ ИЗБРАННОЕ</div>
      {favs.map((s, i) => (
        <Row key={`f${i}`} s={s} />
      ))}
      <div style={{ fontFamily: FONT.tech, fontSize: 11, letterSpacing: "0.14em", color: Z.fgFaint, marginTop: 4 }}>НЕДАВНИЕ</div>
      {rest.map((s, i) => (
        <Row key={`r${i}`} s={s} />
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: FONT.tech, fontSize: 11, letterSpacing: "0.14em", color: Z.fgFaint }}>ЭКИПАЖ · АГЕНТЫ</div>
      <div style={{ height: 34, borderRadius: 6, background: "var(--zy-bg1)", display: "flex", alignItems: "center", gap: 10, paddingLeft: 10, fontFamily: FONT.ui, fontSize: 12.5, color: Z.fg }}>
        <span style={{ width: 7, height: 7, borderRadius: 7, background: Z.success, boxShadow: `0 0 8px ${Z.success}` }} />
        Claude Code · работает
      </div>
    </div>
  );
};
