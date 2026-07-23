// Self-contained SFX/music generator — synthesizes the starter audio set by DSP so the
// engine stays asset-free (no external downloads, no license questions, deterministic).
// Each clip is our own synthesis; the clip→file registry in src/lib/sound is drop-in
// replaceable with Kenney (CC0) / Pixabay files later if a hand-picked sample is wanted.
//   node scripts/gen-sfx.mjs   (or: npm run gen-sfx)  → writes public/audio/*.wav
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SR = 48000; // 48 kHz — matches mp4/AAC muxing, avoids resample on render
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
const TAU = Math.PI * 2;

// deterministic PRNG (seeded) so regenerating gives byte-identical files
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ── WAV (16-bit PCM) writer ──
const writeWav = (name, chans) => {
  const numCh = chans.length;
  const n = chans[0].length;
  const blockAlign = numCh * 2;
  const dataSize = n * blockAlign;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numCh, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * blockAlign, 28); buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(dataSize, 40);
  let off = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      buf.writeInt16LE((s * 32767) | 0, off); off += 2;
    }
  fs.writeFileSync(path.join(OUT, name), buf);
  // audit peak/RMS in dBFS so we can confirm (without listening) it's neither silence nor clipped
  let peak = 0, sumSq = 0, count = 0;
  for (const ch of chans)
    for (const v of ch) { peak = Math.max(peak, Math.abs(v)); sumSq += v * v; count++; }
  const rms = Math.sqrt(sumSq / count);
  const dB = (x) => (x <= 0 ? "-inf" : (20 * Math.log10(x)).toFixed(1));
  return { name, ms: Math.round((n / SR) * 1000), ch: numCh, peak: dB(peak), rms: dB(rms) };
};

// ── helpers ──
const secs = (s) => Math.round(s * SR);
const normalize = (a, peak = 0.75) => {
  let m = 0;
  for (const v of a) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < a.length; i++) a[i] = (a[i] / m) * peak;
  return a;
};
// Softening pass — the design PRINCIPLE for this set: sounds should be soft/tactile, not
// sharp or hissy. Every clip with high-frequency content gets rolled off through this
// N-pole low-pass (in place). Prefer filtered tones over raw noise/saw; UI transitions get
// a gentle tonal swell, not a bright noise whoosh.
const lowpass = (a, fc, poles = 2) => {
  const k = onepole(fc);
  for (let p = 0; p < poles; p++) {
    let y = 0;
    for (let i = 0; i < a.length; i++) { y += k * (a[i] - y); a[i] = y; }
  }
  return a;
};
// exponential-decay envelope with a short linear attack
const env = (t, attack, tau) => (t < attack ? t / attack : Math.exp(-(t - attack) / tau));
// one-pole coefficient for cutoff fc (Hz)
const onepole = (fc) => 1 - Math.exp(-TAU * fc / SR);

// ── clips ──

// soft tick — a rounded tonal blip (no noise transient — that read as a sharp click),
// lands exactly on the tap frame
const tap = () => {
  const N = secs(0.06), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    y[i] = (Math.sin(TAU * 1150 * t) + 0.3 * Math.sin(TAU * 2300 * t)) * env(t, 0.002, 0.016) * 0.7;
  }
  lowpass(y, 3200, 2);
  return normalize(y, 0.6);
};

// select tick — a soft blip, lower/gentler than the old bright one, different timbre from tap
const select = () => {
  const N = secs(0.055), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    y[i] = (Math.sin(TAU * 1400 * t) + 0.3 * Math.sin(TAU * 2100 * t)) * env(t, 0.002, 0.014);
  }
  lowpass(y, 2800, 2);
  return normalize(y, 0.5);
};

// confirm "thock" — lower, a touch of body; commitment
const confirm = () => {
  const N = secs(0.1), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const p = 640 - 120 * Math.min(1, t / 0.03); // slight downward pitch
    y[i] = (Math.sin(TAU * p * t) + 0.3 * Math.sin(TAU * p * 2 * t)) * env(t, 0.001, 0.05);
  }
  return normalize(y, 0.7);
};

// pop — quick pitch-up blip
const pop = () => {
  const N = secs(0.09), y = new Float32Array(N);
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const f = 300 + 700 * Math.min(1, t / 0.05);
    ph += (TAU * f) / SR;
    y[i] = Math.sin(ph) * env(t, 0.002, 0.03);
  }
  return normalize(y, 0.66);
};

// whoosh — soft "air" swell for scene cuts. Gentle low sweep + heavy low-pass so it reads
// as air, NOT a bright hiss/friction (the old bright version rasped, esp. sped up).
const whoosh = () => {
  const N = secs(0.5), y = new Float32Array(N);
  const rng = mulberry32(7);
  let lp = 0, sub = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const prog = t / (N / SR);
    const nz = rng() * 2 - 1;
    const fc = 350 + 1500 * Math.sin(Math.PI * prog); // gentler, lower sweep
    lp += onepole(fc) * (nz - lp);
    sub += onepole(140) * (nz - sub); // remove rumble
    const swell = Math.sin(Math.PI * prog) ** 1.6; // 0→1→0
    y[i] = (lp - sub) * swell;
  }
  lowpass(y, 2000, 2); // soften the hiss into air
  return normalize(y, 0.6);
};

// sheet — soft panel-rise: a gentle upward tonal glide with a swell, heavily low-passed.
// A pleasant "woomp", NOT the noise whoosh (which rasped like friction on the sheet open).
const sheet = () => {
  const N = secs(0.42), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR, prog = t / (N / SR);
    const f = 260 + 340 * prog; // gentle upward glide
    const tone = Math.sin(TAU * f * t) + 0.22 * Math.sin(TAU * f * 2 * t);
    y[i] = tone * Math.sin(Math.PI * prog) * 0.5; // 0→1→0 swell
  }
  lowpass(y, 1600, 2); // very soft, no highs
  return normalize(y, 0.5);
};

// success — layered arpeggio (backbone tones) + high shimmer + short fake reverb tail
const success = () => {
  const N = secs(1.1), y = new Float32Array(N);
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const rng = mulberry32(23);
  for (let k = 0; k < notes.length; k++) {
    const f = notes[k], start = k * 0.06;
    for (let i = 0; i < N; i++) {
      const t = i / SR - start;
      if (t < 0) continue;
      const e = env(t, 0.004, 0.42);
      y[i] += (Math.sin(TAU * f * t) + 0.28 * Math.sin(TAU * f * 2 * t)) * e * 0.5;
    }
  }
  // high shimmer sparkle
  let sh = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const nz = rng() * 2 - 1;
    sh += onepole(6500) * (nz - sh);
    y[i] += (nz - sh) * env(t, 0.02, 0.5) * 0.12;
  }
  // fake reverb: a few decaying delayed taps
  const taps = [[secs(0.06), 0.4], [secs(0.13), 0.26], [secs(0.22), 0.16]];
  const dry = Float32Array.from(y);
  for (const [d, g] of taps)
    for (let i = d; i < N; i++) y[i] += dry[i - d] * g;
  return normalize(y, 0.82);
};

// music bed — the researched tech/crypto-promo profile (2026-07-12): NOT a static sustained
// pad (which read as a tense "organ drone" with no forward motion) but a MOVING minimal-
// electronic loop — an 8th-note arpeggio pluck (the hook) over a soft four-on-the-floor
// pulse + sub-bass on the downbeats, with a sidechain "breath" pumping the pad against the
// pulse. C-major center (C–G–Am–F, the bright pop progression) so it reads optimistic/clean-
// tech, not tense. 120 BPM, 8s = 4 bars → seamless loop (every note decays within its bar,
// nothing crosses the seam). PLACEHOLDER: a real Pixabay track (e.g. "Minimal Tech Corporate")
// is the premium swap — download it to public/audio/bed.wav and it drops straight in.
const saw = (f, t) => 2 * ((f * t) % 1) - 1;
const tri = (f, t) => 2 * Math.abs(2 * ((f * t) % 1) - 1) - 1; // softer than saw (1/n² harmonics)

const bed = () => {
  const N = secs(8);
  const L = new Float32Array(N), R = new Float32Array(N);
  const padL = new Float32Array(N), padR = new Float32Array(N); // sidechained layer
  const hitL = new Float32Array(N), hitR = new Float32Array(N); // kick + pluck (not ducked)
  const BPM = 120, beat = 60 / BPM; // 0.5s; bar = 4 beats = 2s; 4 bars = 8s
  const CHORDS = [
    { root: 65.41, triad: [261.63, 329.63, 392.0] }, // C  : C4 E4 G4
    { root: 98.0, triad: [293.66, 392.0, 493.88] }, // G  : D4 G4 B4
    { root: 110.0, triad: [220.0, 261.63, 329.63] }, // Am : A3 C4 E4
    { root: 87.31, triad: [261.63, 349.23, 440.0] }, // F  : C4 F4 A4
  ];
  const ARP = [0, 1, 2, 1, 0, 2, 1, 2]; // 8th-note index into the triad — gentle up/down

  // additive note writer
  const add = (chan, tStart, f, dur, attack, tau, gain, wave) => {
    const s0 = secs(tStart), len = secs(dur);
    for (let i = 0; i < len && s0 + i < N; i++) {
      const tt = i / SR;
      const v = wave === "saw" ? saw(f, tt) : wave === "tri" ? tri(f, tt) : Math.sin(TAU * f * tt);
      chan[s0 + i] += v * env(tt, attack, tau) * gain;
    }
  };

  for (let bar = 0; bar < 4; bar++) {
    const c = CHORDS[bar], barT = bar * beat * 4;
    // pad — sustained triad (sine, soft), detuned L/R for width; goes to the ducked layer
    for (const f of c.triad) {
      add(padL, barT, f, 2.0, 0.4, 0.95, 0.18, "sine");
      add(padR, barT, f * 1.003, 2.0, 0.4, 0.95, 0.18, "sine");
    }
    // sub-bass on beats 0 & 2 (ducked with the pad)
    for (const b of [0, 2]) {
      add(padL, barT + b * beat, c.root, 0.42, 0.004, 0.16, 0.5, "sine");
      add(padR, barT + b * beat, c.root, 0.42, 0.004, 0.16, 0.5, "sine");
    }
    // arpeggio pluck — SPARSE (quarter notes, every other 8th) + soft/quiet, triangle: a gentle
    // sparkle over the pad, not an insistent "ticking" that grates over 36s. NO kick (the four-
    // on-the-floor pulse read as too busy/annoying) — the shallow sidechain breath alone gives
    // subtle motion. This deliberately leans ambient/soft (stopgap until a real track drops in).
    for (let n = 0; n < 8; n += 2) {
      const f = c.triad[ARP[n]];
      add(hitL, barT + n * (beat / 2), f, 0.4, 0.012, 0.16, 0.08, "tri");
      add(hitR, barT + n * (beat / 2), f, 0.4, 0.012, 0.16, 0.08, "tri");
    }
  }

  // sidechain "breath": duck the pad/bass right on each beat, recover before the next
  const dip = (t) => 0.68 + 0.32 * Math.pow((t % beat) / beat, 0.6); // shallow breath, no hard pump
  // 2-pole low-pass — heavier now (~2.2 kHz) for a soft, warm, non-fatiguing character.
  const lpa = onepole(2200);
  let fL1 = 0, fL2 = 0, fR1 = 0, fR2 = 0;
  for (let i = 0; i < N; i++) {
    const d = dip(i / SR);
    // drive >1 into tanh = light bus compression (tames peaks, lifts RMS, keeps headroom)
    const mixL = Math.tanh((padL[i] * d + hitL[i]) * 1.6);
    const mixR = Math.tanh((padR[i] * d + hitR[i]) * 1.6);
    fL1 += lpa * (mixL - fL1); fL2 += lpa * (fL1 - fL2); L[i] = fL2;
    fR1 += lpa * (mixR - fR1); fR2 += lpa * (fR1 - fR2); R[i] = fR2;
  }
  // peak-normalize the pair together
  let m = 0;
  for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  if (m > 0) for (let i = 0; i < N; i++) { L[i] = (L[i] / m) * 0.7; R[i] = (R[i] / m) * 0.7; }
  return [L, R];
};

// count-up — accelerating ticks (interval shrinks) rising in pitch as numbers climb, then a
// soft major "ding" as they land. ~2.3s so its resolve lines up with a staggered group of
// counters finishing. Place its start on the first counter's count-up frame.
const count = () => {
  const N = secs(2.3), y = new Float32Array(N);
  const times = [];
  let t = 0, iv = 0.13;
  while (t < 2.02) { times.push(t); iv = Math.max(0.045, iv * 0.955); t += iv; } // accelerate
  for (const tk of times) {
    const freq = 1500 + 1500 * (tk / 2.05); // pitch climbs with the count
    const start = secs(tk), len = secs(0.03);
    for (let i = 0; i < len && start + i < N; i++) {
      const tt = i / SR;
      y[start + i] += Math.sin(TAU * freq * tt) * env(tt, 0.001, 0.008) * 0.5;
    }
  }
  // resolve ding — major third C6+E6, soft
  const dAt = secs(2.08), dNotes = [1046.5, 1318.5];
  for (let i = dAt; i < N; i++) {
    const tt = (i - dAt) / SR;
    let s = 0;
    for (const f of dNotes) s += Math.sin(TAU * f * tt) + 0.3 * Math.sin(TAU * f * 2 * tt);
    y[i] += s * env(tt, 0.004, 0.22) * 0.4;
  }
  // short reverb tail for air
  const dry = Float32Array.from(y);
  for (const [d, g] of [[secs(0.05), 0.3], [secs(0.11), 0.18]])
    for (let i = d; i < N; i++) y[i] += dry[i - d] * g;
  return normalize(y, 0.7);
};

// level-up chime — soft rising two-note "ta-da" (a perfect fifth up), rounder/gentler than
// the bright 'success' arpeggio. Soft attack, low-passed so nothing pierces. For the beat.
const levelUp = () => {
  const N = secs(0.7), y = new Float32Array(N);
  const notes = [[0.0, 587.33], [0.085, 880.0]]; // D5 → A5, gentle rising fifth
  for (const [start, f] of notes) {
    for (let i = 0; i < N; i++) {
      const t = i / SR - start;
      if (t < 0) continue;
      y[i] += (Math.sin(TAU * f * t) + 0.24 * Math.sin(TAU * f * 2 * t)) * env(t, 0.006, 0.26) * 0.5;
    }
  }
  const dry = Float32Array.from(y);
  for (const [d, g] of [[secs(0.05), 0.28], [secs(0.11), 0.16]]) // short air tail
    for (let i = d; i < N; i++) y[i] += dry[i - d] * g;
  lowpass(y, 3600, 2); // keep it soft
  return normalize(y, 0.6);
};

// city ambient — distant traffic rumble: brown noise, heavy low-pass (no harsh highs so it
// never grates), slow amplitude drift so it breathes instead of being static. Stereo, ~8s,
// intentionally quiet — a background texture. PLACEHOLDER: a real Pixabay "city ambience"
// (CC0) drops straight into public/audio/cityAmbient.wav if a hand-picked one is preferred.
const cityAmbient = () => {
  const N = secs(8);
  const L = new Float32Array(N), R = new Float32Array(N);
  const rL = mulberry32(101), rR = mulberry32(202);
  let bL = 0, bR = 0; // brown-noise accumulators (leaky-integrated white)
  let a1 = 0, a2 = 0, a3 = 0, c1 = 0, c2 = 0, c3 = 0;
  const k = onepole(430); // heavy 3-pole low-pass → distant, warm, no hiss
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    bL = (bL + (rL() * 2 - 1) * 0.02) * 0.995;
    bR = (bR + (rR() * 2 - 1) * 0.02) * 0.995;
    a1 += k * (bL - a1); a2 += k * (a1 - a2); a3 += k * (a2 - a3);
    c1 += k * (bR - c1); c2 += k * (c1 - c2); c3 += k * (c2 - c3);
    const drift = 0.78 + 0.16 * Math.sin(TAU * 0.07 * t + 0.6) + 0.08 * Math.sin(TAU * 0.024 * t);
    L[i] = a3 * drift; R[i] = c3 * drift;
  }
  let m = 0;
  for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  if (m > 0) for (let i = 0; i < N; i++) { L[i] = (L[i] / m) * 0.55; R[i] = (R[i] / m) * 0.55; }
  return [L, R];
};

// ── extended set (Zarya promo experiment) — moment-specific cues ──

// power-down — a hard CRT/power-loss cut: pitch collapses fast with an early crackle,
// then dies. For the shutdown "the machine loses power" beat.
const powerDown = () => {
  const N = secs(0.55), y = new Float32Array(N);
  const rng = mulberry32(31);
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, prog = t / (N / SR);
    const f = 520 * Math.pow(0.12, prog); // 520 → ~62 Hz collapse
    ph += (TAU * f) / SR;
    const crackle = (rng() * 2 - 1) * Math.max(0, 0.45 - prog) * 0.35; // early electric crackle
    y[i] = (Math.sin(ph) * 0.85 + crackle) * env(t, 0.001, 0.15) * (1 - prog * 0.35);
  }
  lowpass(y, 2400, 2);
  return normalize(y, 0.72);
};

// power-up — a warm rising swell that lands on a soft bell: the app powers back.
const powerUp = () => {
  const N = secs(0.62), y = new Float32Array(N);
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, prog = t / (N / SR);
    const f = 80 * Math.pow(6, prog); // 80 → ~480 Hz rise
    ph += (TAU * f) / SR;
    y[i] = Math.sin(ph) * Math.sin(Math.PI * prog * 0.9) * 0.6;
  }
  const bAt = secs(0.44); // soft bell landing (E5)
  for (let i = bAt; i < N; i++) {
    const tt = (i - bAt) / SR;
    y[i] += (Math.sin(TAU * 659.25 * tt) + 0.3 * Math.sin(TAU * 1318.5 * tt)) * env(tt, 0.004, 0.16) * 0.38;
  }
  lowpass(y, 3000, 2);
  return normalize(y, 0.62);
};

// dawn chime — Заря rising: a soft major bell bloom (C–E–G–C) with airy shimmer.
const dawnChime = () => {
  const N = secs(1.3), y = new Float32Array(N);
  const notes = [[0, 523.25], [0.12, 659.25], [0.24, 783.99], [0.4, 1046.5]];
  const rng = mulberry32(41);
  for (const [start, f] of notes)
    for (let i = 0; i < N; i++) {
      const t = i / SR - start;
      if (t < 0) continue;
      y[i] += (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2 * t) + 0.1 * Math.sin(TAU * f * 3 * t)) * env(t, 0.02, 0.55) * 0.4;
    }
  let sh = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, nz = rng() * 2 - 1;
    sh += onepole(7000) * (nz - sh);
    y[i] += (nz - sh) * env(t, 0.05, 0.6) * 0.06;
  }
  const dry = Float32Array.from(y);
  for (const [d, g] of [[secs(0.08), 0.3], [secs(0.17), 0.18]])
    for (let i = d; i < N; i++) y[i] += dry[i - d] * g;
  lowpass(y, 5000, 1);
  return normalize(y, 0.66);
};

// morph — the unified bar transforming into the choice selector: a quick filtered
// up-sweep + a soft tone, digital but not harsh.
const morph = () => {
  const N = secs(0.35), y = new Float32Array(N);
  const rng = mulberry32(53);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, prog = t / (N / SR);
    const nz = rng() * 2 - 1;
    lp += onepole(600 + 2400 * prog) * (nz - lp);
    const tone = Math.sin(TAU * (400 + 500 * prog) * t) * 0.4;
    y[i] = (lp * 0.5 + tone) * Math.pow(Math.sin(Math.PI * prog), 1.2);
  }
  lowpass(y, 3200, 2);
  return normalize(y, 0.52);
};

// type tick — a very short, soft keystroke click (for typing in the bar).
const typeTick = () => {
  const N = secs(0.03), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    y[i] = Math.sin(TAU * 1800 * t) * env(t, 0.0008, 0.006) * 0.5;
  }
  lowpass(y, 4000, 1);
  return normalize(y, 0.42);
};

// rumble — deep sub-bass thrust swell under the rocket liftoff (~1.2s).
const rumble = () => {
  const N = secs(1.2), y = new Float32Array(N);
  const rng = mulberry32(61);
  let b = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, prog = t / (N / SR);
    b = (b + (rng() * 2 - 1) * 0.02) * 0.995; // brown-noise texture
    const sub = Math.sin(TAU * 46 * t) * 0.6 + Math.sin(TAU * 68 * t) * 0.3;
    const swell = Math.pow(Math.sin(Math.PI * Math.min(1, prog * 1.3)), 1.4);
    y[i] = (sub + b * 2) * swell;
  }
  lowpass(y, 240, 3); // keep it deep, no highs
  return normalize(y, 0.74);
};

// count tick — a firm single tick for the 3·2·1 countdown steps.
const countTick = () => {
  const N = secs(0.07), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    y[i] = (Math.sin(TAU * 900 * t) + 0.3 * Math.sin(TAU * 1800 * t)) * env(t, 0.001, 0.02);
  }
  lowpass(y, 3000, 2);
  return normalize(y, 0.62);
};

// ── run ──
fs.mkdirSync(OUT, { recursive: true });
const report = [];
report.push(writeWav("tap.wav", [tap()]));
report.push(writeWav("select.wav", [select()]));
report.push(writeWav("confirm.wav", [confirm()]));
report.push(writeWav("pop.wav", [pop()]));
report.push(writeWav("whoosh.wav", [whoosh()]));
report.push(writeWav("sheet.wav", [sheet()]));
report.push(writeWav("success.wav", [success()]));
report.push(writeWav("count.wav", [count()]));
report.push(writeWav("levelup.wav", [levelUp()]));
report.push(writeWav("powerDown.wav", [powerDown()]));
report.push(writeWav("powerUp.wav", [powerUp()]));
report.push(writeWav("dawnChime.wav", [dawnChime()]));
report.push(writeWav("morph.wav", [morph()]));
report.push(writeWav("typeTick.wav", [typeTick()]));
report.push(writeWav("rumble.wav", [rumble()]));
report.push(writeWav("countTick.wav", [countTick()]));
report.push(writeWav("cityAmbient.wav", cityAmbient()));
report.push(writeWav("bed.wav", bed()));
console.log("generated → public/audio/");
for (const r of report)
  console.log(`  ${r.name.padEnd(14)} ${String(r.ms).padStart(5)}ms  ${r.ch}ch  peak ${r.peak} dBFS  rms ${r.rms} dBFS`);
