import { promises as fs } from "fs";

const SFX_URL = "https://api.elevenlabs.io/v1/sound-generation";

const MAX_SFX_SECONDS = 22;

// Generate a seamless-looping ambience bed. The mixer loops it under the full scene.
export async function generateAmbience(prompt: string, outPath: string, duration = MAX_SFX_SECONDS): Promise<string> {
  const safeDuration = Math.min(Math.max(duration, 8), MAX_SFX_SECONDS);
  const text = [
    prompt,
    "Continuous immersive cinematic ambience only.",
    "No voices. No dialogue. No music.",
    "Make environmental details clearly audible but not harsh.",
  ].join(" ");
  const res = await fetch(SFX_URL, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_text_to_sound_v2",
      duration_seconds: safeDuration,
      loop: true,
      prompt_influence: 0.55,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs SFX failed: ${res.status}${detail ? ` - ${detail.slice(0, 300)}` : ""}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}

export async function generateSoundEffect(prompt: string, outPath: string, durationSeconds: number): Promise<string> {
  const safeDuration = Math.min(Math.max(durationSeconds, 1.2), 6);
  const text = [
    prompt,
    "Single cinematic sound effect only.",
    "No voices unless the prompt explicitly asks for distant nonverbal human sound.",
    "No music.",
  ].join(" ");
  const res = await fetch(SFX_URL, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_text_to_sound_v2",
      duration_seconds: safeDuration,
      prompt_influence: 0.7,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs SFX event failed: ${res.status}${detail ? ` - ${detail.slice(0, 300)}` : ""}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}
