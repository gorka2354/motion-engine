// Audio self-check — the ear I don't have. Renders (or takes) an mp4 and asserts, purely
// numerically, that it has a real audio track at a sane loudness. Catches "the sound layer
// silently produced nothing / clips / is way too quiet" without anyone listening.
//   node scripts/check-audio.mjs <Comp|file.mp4>
// Uses Remotion's bundled ffmpeg/ffprobe (no system install). Gates:
//   • audio stream present
//   • integrated loudness in [-20, -12] LUFS  (bed-driven promo ≈ -16; a loud voiced feed
//     ad would sit ≈ -14, a gentle instrumental cut ≈ -18 — both fine, silence/clip aren't)
//   • true peak <= -1.0 dBTP                    (headroom, no inter-sample clipping)
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node scripts/check-audio.mjs <CompId|path-to.mp4>");
  process.exit(2);
}
// arg is interpolated into shell strings below (shell needed for npx.cmd on Windows +
// `2>&1` to capture ffprobe/ffmpeg stderr). It comes from a dev/CI invocation, not
// untrusted input — but whitelist it anyway so no shell metacharacter can be injected.
if (!/^[\w./\\:-]+$/.test(arg)) {
  console.error(`invalid arg (allowed: letters, digits, . _ - / \\ :): ${arg}`);
  process.exit(2);
}

// run a shell command; return stdout+stderr merged, never throw (ffprobe/ffmpeg log to stderr)
const capture = (cmd) => {
  try {
    return execSync(`${cmd} 2>&1`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
};

// resolve to an mp4 (render the comp if an id was passed)
let mp4 = arg;
if (!arg.toLowerCase().endsWith(".mp4")) {
  mp4 = path.join("out", "_audiocheck", `${arg}.mp4`);
  fs.mkdirSync(path.dirname(mp4), { recursive: true });
  console.log(`rendering ${arg} → ${mp4} …`);
  capture(`npx remotion render ${arg} "${mp4}" --log=error`);
}
if (!fs.existsSync(mp4)) {
  console.error(`FAIL: ${mp4} not found`);
  process.exit(1);
}

// ffprobe: is there an audio stream?
const probe = capture(`npx remotion ffprobe "${mp4}"`);
const codec = (probe.match(/Audio:\s*(\w+)/) || [])[1];
const hasAudio = !!codec;

// loudnorm measure (drop video: this ffmpeg build has no null video encoder)
const lnJson = capture(`npx remotion ffmpeg -hide_banner -nostats -i "${mp4}" -vn -af loudnorm=print_format=json -f null -`);
const grab = (k) => {
  const m = lnJson.match(new RegExp(`"${k}"\\s*:\\s*"(-?[\\d.]+|-?inf)"`));
  return m ? parseFloat(m[1]) : NaN;
};
const lufs = grab("input_i");
const tp = grab("input_tp");

// gates
const LUFS_LO = -20, LUFS_HI = -12, TP_MAX = -1.0;
const fails = [];
if (!hasAudio) fails.push("no audio stream");
if (!(lufs >= LUFS_LO && lufs <= LUFS_HI)) fails.push(`loudness ${lufs} LUFS outside [${LUFS_LO}, ${LUFS_HI}]`);
if (!(tp <= TP_MAX)) fails.push(`true peak ${tp} dBTP exceeds ${TP_MAX}`);

console.log(`\naudio check — ${path.basename(mp4)}`);
console.log(`  stream     : ${hasAudio ? `present (${codec})` : "MISSING"}`);
console.log(`  loudness   : ${isNaN(lufs) ? "?" : lufs} LUFS   (target -16, gate [${LUFS_LO},${LUFS_HI}])`);
console.log(`  true peak  : ${isNaN(tp) ? "?" : tp} dBTP   (gate <= ${TP_MAX})`);

if (fails.length) {
  console.error(`\nFAIL: ${fails.join("; ")}`);
  process.exit(1);
}
console.log(`\nPASS`);
