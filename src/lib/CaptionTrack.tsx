import React from "react";

/** A timed caption/lower-third: visible on frames [from, to). Extra fields (title,
 *  sub, y, …) are whatever the render function you pass needs. */
export interface CaptionCue {
  from: number;
  to: number;
}

/**
 * A data-driven caption track — declare the cues as an array and a `render`
 * function, keeping lower-thirds authorable as data (the engine's "promo as
 * data" principle) instead of hand-placed JSX. Pairs with {@link captionOverlaps}
 * to catch two captions fighting for the screen at once.
 */
export function CaptionTrack<T extends CaptionCue>({
  cues,
  render,
}: {
  cues: T[];
  render: (cue: T, index: number) => React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      {cues.map((c, i) => (
        <React.Fragment key={i}>{render(c, i)}</React.Fragment>
      ))}
    </>
  );
}

/** The cues visible at `frame` ([from, to) half-open). */
export const activeCaptions = <T extends CaptionCue>(cues: T[], frame: number): T[] =>
  cues.filter((c) => frame >= c.from && frame < c.to);

/** Pairs of cues whose [from, to) windows overlap — for scenes that want exactly
 *  one caption on screen at a time (empty = none overlap). */
export const captionOverlaps = <T extends CaptionCue>(cues: T[]): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < cues.length; i++) {
    for (let j = i + 1; j < cues.length; j++) {
      if (cues[i].from < cues[j].to && cues[j].from < cues[i].to) out.push([i, j]);
    }
  }
  return out;
};
