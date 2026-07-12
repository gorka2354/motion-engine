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
// exponential-decay envelope with a short linear attack
const env = (t, attack, tau) => (t < attack ? t / attack : Math.exp(-(t - attack) / tau));
// one-pole coefficient for cutoff fc (Hz)
const onepole = (fc) => 1 - Math.exp(-TAU * fc / SR);

// ── clips ──

// short high click — reflexive, lands exactly on the tap frame
const tap = () => {
  const N = secs(0.055), y = new Float32Array(N);
  const rng = mulberry32(11);
  let hp = 0, lpPrev = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const tone = Math.sin(TAU * 1650 * t) * env(t, 0.0008, 0.014);
    const nz = rng() * 2 - 1;
    lpPrev += onepole(6000) * (nz - lpPrev);
    hp = nz - lpPrev; // crude highpass → crisp transient
    y[i] = tone * 0.7 + hp * env(t, 0.0005, 0.008) * 0.5;
  }
  return normalize(y, 0.72);
};

// select tick — brighter/thinner than tap, a different timbre so picks don't sound like taps
const select = () => {
  const N = secs(0.05), y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    y[i] = (Math.sin(TAU * 2300 * t) + 0.4 * Math.sin(TAU * 3450 * t)) * env(t, 0.001, 0.012);
  }
  return normalize(y, 0.6);
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

// whoosh — band-passed noise with a sweeping lowpass + amplitude swell; for scene cuts
const whoosh = () => {
  const N = secs(0.5), y = new Float32Array(N);
  const rng = mulberry32(7);
  let lp = 0, sub = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const prog = t / (N / SR);
    const nz = rng() * 2 - 1;
    const fc = 500 + 3200 * Math.sin(Math.PI * prog); // rise then fall
    lp += onepole(fc) * (nz - lp);
    sub += onepole(160) * (nz - sub); // remove rumble
    const swell = Math.sin(Math.PI * prog) ** 1.5; // 0→1→0
    y[i] = (lp - sub) * swell;
  }
  return normalize(y, 0.7);
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

// music bed — bright, warm Cmaj9 pad (major, NOT the earlier minor Am7 which read as
// tense/ominous), 8s seamless loop (all partials complete whole cycles in 8s). No sub-bass
// (dropped the 110 Hz drone that made it muddy/heavy); mid register + airy maj7/9 voices
// give it an optimistic "clean tech" feel. Gentle saturation only. Stereo via L/R phase.
// PLACEHOLDER: swap for a Pixabay track for the final cut.
const bed = () => {
  const dur = 8, N = secs(dur);
  const L = new Float32Array(N), R = new Float32Array(N);
  // C3 G3 C4 E4 G4 + B4(maj7) D5(add9) — Cmaj9, mid/upper register, all integer cycles/8s.
  const voices = [
    { f: 131, a: 0.4, hi: false }, { f: 196, a: 0.48, hi: false },
    { f: 262, a: 0.55, hi: false }, { f: 330, a: 0.5, hi: false }, { f: 392, a: 0.42, hi: false },
    { f: 494, a: 0.3, hi: true }, { f: 588, a: 0.22, hi: true },
  ];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const lfo = 0.5 + 0.5 * Math.sin(TAU * 0.125 * t); // 8s period → 1 whole cycle
    const filt = 0.55 + 0.45 * Math.sin(TAU * 0.25 * t); // slow timbral movement, 2 cycles
    let l = 0, r = 0;
    for (const v of voices) {
      const amp = v.a * (v.hi ? filt : 1); // upper partials shimmer with the filter
      l += Math.sin(TAU * v.f * t) * amp;
      r += Math.sin(TAU * v.f * t + 0.5) * amp; // phase offset = width
    }
    const g = 0.11 + 0.05 * lfo; // gentle breathing
    // light saturation — warms the pad + raises RMS a touch, but soft enough to stay airy
    L[i] = Math.tanh(l * 0.38) * g;
    R[i] = Math.tanh(r * 0.38) * g;
  }
  // peak-normalize the pair together to keep stereo balance
  let m = 0;
  for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  if (m > 0) for (let i = 0; i < N; i++) { L[i] = (L[i] / m) * 0.5; R[i] = (R[i] / m) * 0.5; }
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

// ── run ──
fs.mkdirSync(OUT, { recursive: true });
const report = [];
report.push(writeWav("tap.wav", [tap()]));
report.push(writeWav("select.wav", [select()]));
report.push(writeWav("confirm.wav", [confirm()]));
report.push(writeWav("pop.wav", [pop()]));
report.push(writeWav("whoosh.wav", [whoosh()]));
report.push(writeWav("success.wav", [success()]));
report.push(writeWav("count.wav", [count()]));
report.push(writeWav("bed.wav", bed()));
console.log("generated → public/audio/");
for (const r of report)
  console.log(`  ${r.name.padEnd(14)} ${String(r.ms).padStart(5)}ms  ${r.ch}ch  peak ${r.peak} dBFS  rms ${r.rms} dBFS`);
