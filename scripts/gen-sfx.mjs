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
      add(padL, barT, f, 2.0, 0.35, 0.9, 0.15, "sine");
      add(padR, barT, f * 1.003, 2.0, 0.35, 0.9, 0.15, "sine");
    }
    // sub-bass on beats 0 & 2 (ducked with the pad)
    for (const b of [0, 2]) {
      add(padL, barT + b * beat, c.root, 0.42, 0.004, 0.16, 0.5, "sine");
      add(padR, barT + b * beat, c.root, 0.42, 0.004, 0.16, 0.5, "sine");
    }
    // soft kick on every beat (felt, not heard) — not ducked
    for (let b = 0; b < 4; b++) {
      const s0 = secs(barT + b * beat), len = secs(0.12);
      for (let i = 0; i < len && s0 + i < N; i++) {
        const tt = i / SR;
        const pitch = 90 - 45 * Math.min(1, tt / 0.04); // pitch drop
        const k = Math.sin(TAU * pitch * tt) * env(tt, 0.001, 0.05) * 0.4;
        hitL[s0 + i] += k; hitR[s0 + i] += k;
      }
    }
    // arpeggio pluck — 8th notes, TRIANGLE (soft, not the piercing saw), mid register
    // (no octave-up — saw + an octave up was the "mosquito" whine), gentle attack, quick decay
    for (let n = 0; n < 8; n++) {
      const f = c.triad[ARP[n]];
      add(hitL, barT + n * (beat / 2), f, 0.34, 0.006, 0.11, 0.14, "tri");
      add(hitR, barT + n * (beat / 2), f, 0.34, 0.006, 0.11, 0.14, "tri");
    }
  }

  // sidechain "breath": duck the pad/bass right on each beat, recover before the next
  const dip = (t) => 0.45 + 0.55 * Math.pow((t % beat) / beat, 0.6);
  // 2-pole low-pass on the mix — rolls off the harsh highs / saw aliasing that read as a
  // "mosquito" whine, for the warm, soft character these beds have. Cutoff ~3 kHz.
  const lpa = onepole(3000);
  let fL1 = 0, fL2 = 0, fR1 = 0, fR2 = 0;
  for (let i = 0; i < N; i++) {
    const d = dip(i / SR);
    // drive >1 into tanh = light bus compression (tames peaks, lifts RMS, keeps headroom)
    const mixL = Math.tanh((padL[i] * d + hitL[i]) * 1.8);
    const mixR = Math.tanh((padR[i] * d + hitR[i]) * 1.8);
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
report.push(writeWav("bed.wav", bed()));
console.log("generated → public/audio/");
for (const r of report)
  console.log(`  ${r.name.padEnd(14)} ${String(r.ms).padStart(5)}ms  ${r.ch}ch  peak ${r.peak} dBFS  rms ${r.rms} dBFS`);
