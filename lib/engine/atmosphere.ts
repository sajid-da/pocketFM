import { promises as fs } from "fs";

const SFX_URL = "https://api.elevenlabs.io/v1/sound-generation";

const MAX_SFX_SECONDS = 22;
const RETRY_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postElevenLabsSound(body: Record<string, unknown>, label: string) {
  const maxAttempts = 4;
  let lastDetail = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(SFX_URL, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());

    lastDetail = await res.text().catch(() => "");
    if (!RETRY_STATUSES.has(res.status) || attempt === maxAttempts) {
      throw new Error(`${label} failed: ${res.status}${lastDetail ? ` - ${lastDetail.slice(0, 300)}` : ""}`);
    }
    await sleep(1200 * attempt);
  }
  throw new Error(`${label} failed${lastDetail ? ` - ${lastDetail.slice(0, 300)}` : ""}`);
}

// Generate a seamless-looping ambience bed. The mixer loops it under the full scene.
export async function generateAmbience(prompt: string, outPath: string, duration = MAX_SFX_SECONDS): Promise<string> {
  const safeDuration = Math.min(Math.max(duration, 8), MAX_SFX_SECONDS);
  const text = [
    prompt,
    "Continuous immersive cinematic ambience only.",
    "No voices. No dialogue. No music.",
    "Make environmental details clearly audible but not harsh.",
  ].join(" ");
  const buf = await postElevenLabsSound({
    text,
    model_id: "eleven_text_to_sound_v2",
    duration_seconds: safeDuration,
    loop: true,
    prompt_influence: 0.55,
  }, "ElevenLabs ambience");
  await fs.writeFile(outPath, buf);
  return outPath;
}

export async function generateFallbackAmbience(outPath: string): Promise<string> {
  const sampleRate = 44100;
  const seconds = 12;
  const samples = sampleRate * seconds;
  const header = Buffer.alloc(44);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const noise = (Math.random() * 2 - 1) * 1000;
    const rumble = Math.sin(i / 160) * 260;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, noise + rumble)), i * 2);
  }
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  await fs.writeFile(outPath, Buffer.concat([header, data]));
  return outPath;
}

export async function generateSoundEffect(prompt: string, outPath: string, durationSeconds: number): Promise<string> {
  const safeDuration = Math.min(Math.max(durationSeconds, 1.2), 6);
  const text = [
    prompt,
    "Single cinematic sound effect only.",
    "No spoken dialogue. Nonverbal creature, ghost, monster, demon, alien, or entity vocalizations are allowed when the prompt asks for them.",
    "No music.",
    "Make the sound physically present and realistic, with clear attack and natural decay.",
  ].join(" ");
  const buf = await postElevenLabsSound({
    text,
    model_id: "eleven_text_to_sound_v2",
    duration_seconds: safeDuration,
    prompt_influence: 0.7,
  }, "ElevenLabs SFX event");
  await fs.writeFile(outPath, buf);
  return outPath;
}

export async function generateFallbackSoundEffect(prompt: string, outPath: string, durationSeconds: number): Promise<string> {
  const sampleRate = 44100;
  const safeDuration = Math.min(Math.max(durationSeconds, 0.8), 4);
  const samples = Math.round(sampleRate * safeDuration);
  const header = Buffer.alloc(44);
  const data = Buffer.alloc(samples * 2);
  const low = /monster|growl|breath|demon|entity|ghost|spirit/i.test(prompt) ? 95 : 180;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / safeDuration);
    const tone = Math.sin(2 * Math.PI * low * t) * 6500 * envelope;
    const noise = (Math.random() * 2 - 1) * 1800 * envelope;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, tone + noise)), i * 2);
  }
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  await fs.writeFile(outPath, Buffer.concat([header, data]));
  return outPath;
}
