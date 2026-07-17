// AI generation presets — the prompt patterns + request builders for the Magic Hour
// pipeline, distilled from the Level-Up creative (2026-07-15). Pure functions (no I/O, no
// network) so they're unit-testable and deterministic. The client (client.mjs) turns a
// built {endpoint, body} into an actual API call.
//
// Why patterns matter: half the Level-Up work was discovering the prompt phrasing that
// makes AI footage read as REAL (documentary, eyes off-camera, no "anime eyes") and stay
// CONSISTENT across clips (keep identity, static camera). Encoding them means the next
// project starts from the proven baseline instead of re-deriving it.

export const API_BASE = "https://api.magichour.ai/v1";

/** Model registry — sensible defaults per task + documented alternatives. */
export const MODELS = {
  image: { default: "seedream-v4", alts: ["gpt-image-2", "flux-2-klein"] }, // photoreal humans
  edit: { default: "nano-banana", alts: ["qwen-edit", "flux-2-klein"] }, // identity-preserving edits
  video: { default: "kling-3.0", alts: ["seedance-2.0", "veo3.1"] }, // i2v; veo weak on hands
};

// ── reusable prompt fragments (the hard-won phrasing) ──
export const FRAG = {
  // makes a generated person read as a real candid photo, not AI
  realism:
    "photorealistic candid documentary photograph, shot on a phone, natural light, " +
    "shallow depth of field, subtle film grain, realistic imperfect skin texture",
  // the anti-"AI tell" clause — the eyes/gloss are what give AI away
  antiAiLook: "not looking at camera, no anime eyes, no beauty retouch, not glossy, slightly asymmetric face",
  // leave room above the head for HUD/overlay graphics
  headroom: "vertical 9:16 composition, subject in the lower two-thirds, empty space above the head",
  // hold one identity while editing (outfit swap etc.) — keeps pose + background too
  keepIdentity:
    "keep the exact same person, same face and identity, same pose and same background, " +
    "do not change the facial features",
  // hold only the FACE/identity but allow a NEW scene, pose and outfit (transformation beats,
  // where the world evolves with the hero — background + posture change, person stays the same)
  keepFaceOnly:
    "keep the exact same person — the same face, facial features, hair and identity, " +
    "recognizably the same man — but",
  // lock the camera for i2v so clips across a sequence share framing (no drift/push-in)
  staticCamera:
    "static locked tripod camera, no camera movement, no zoom, no push-in, no pan, fixed frame. " +
    "Only the subject moves:",
};

const join = (...parts) => parts.filter(Boolean).join(", ").replace(/,\s*:/g, ":");

/**
 * Build a text-to-image request (photoreal human by default).
 * @param {{prompt:string, aspect?:string, model?:string, count?:number, realism?:boolean, headroom?:boolean, name?:string}} o
 * @returns {{endpoint:string, body:object}}
 */
export function imageRequest(o) {
  const prompt = join(
    o.prompt,
    o.realism !== false && FRAG.realism,
    o.realism !== false && FRAG.antiAiLook,
    o.headroom && FRAG.headroom,
  );
  return {
    endpoint: `${API_BASE}/ai-image-generator`,
    body: {
      name: o.name || "ai image",
      image_count: o.count ?? 1,
      model: o.model || MODELS.image.default,
      aspect_ratio: o.aspect || "9:16",
      resolution: o.resolution || "auto",
      style: { prompt, tool: "general" },
    },
  };
}

/**
 * Build an image-edit request (change something while keeping the same person).
 * @param {{imageUrl:string, instruction:string, model?:string, aspect?:string, resolution?:string, name?:string}} o
 * @returns {{endpoint:string, body:object}}
 */
export function editRequest(o) {
  // newScene: hold the face but let scene/pose/outfit change (transformation) — otherwise a
  // conservative outfit-swap that keeps pose + background (v1 behaviour).
  const prompt = o.newScene
    ? join(FRAG.keepFaceOnly, o.instruction, FRAG.realism)
    : join(FRAG.keepIdentity, "only " + o.instruction, "photorealistic, same lighting");
  return {
    endpoint: `${API_BASE}/ai-image-editor`,
    body: {
      name: o.name || "ai edit",
      image_count: 1,
      model: o.model || MODELS.edit.default,
      aspect_ratio: o.aspect || "9:16",
      resolution: o.resolution || "1k",
      style: { prompt },
      assets: { image_file_paths: [o.imageUrl] },
    },
  };
}

/**
 * Build an image-to-video request. `static: true` locks the camera (keeps framing across a
 * multi-clip sequence — the Level-Up lesson: nano-banana edits + Kling push-in drifted scale).
 * @param {{imageUrl:string, motion:string, model?:string, seconds?:number, resolution?:string, static?:boolean, audio?:boolean, name?:string}} o
 * @returns {{endpoint:string, body:object}}
 */
export function videoRequest(o) {
  const prompt = o.static ? join(FRAG.staticCamera, o.motion) : o.motion;
  const assets = { image_file_path: o.imageUrl };
  // keyframe / first-last-frame: give an END image and the model morphs start→end in ONE
  // continuous shot (no cut). This is the "organic transformation transition" approach —
  // the outfit/scene perceptibly morphs on the moving person instead of a masked splice.
  if (o.endImageUrl) assets.end_image_file_path = o.endImageUrl;
  return {
    endpoint: `${API_BASE}/image-to-video`,
    body: {
      name: o.name || "ai video",
      end_seconds: o.seconds ?? 3,
      model: o.model || MODELS.video.default,
      resolution: o.resolution || "720p",
      audio: o.audio ?? false,
      style: { prompt },
      assets,
    },
  };
}

/** Named end-to-end presets — a whole request from a few knobs. */
export const PRESETS = {
  "realist-person": (prompt, opts = {}) => imageRequest({ prompt, realism: true, headroom: true, ...opts }),
  "outfit-swap": (imageUrl, instruction, opts = {}) => editRequest({ imageUrl, instruction, ...opts }),
  "tap-clip": (imageUrl, opts = {}) =>
    videoRequest({ imageUrl, motion: opts.motion || "the person taps their phone screen, subtle natural motion, a small smile", static: true, ...opts }),
};
