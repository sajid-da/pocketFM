import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import type { SceneLine } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TTS_MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";

const VOICE_POOL: Record<string, string> = {
  narrator: "verse", male: "ash", female: "nova",
  child: "coral", villain: "ballad", default: "shimmer",
};
const voiceFor = (role?: string) => VOICE_POOL[(role || "default").toLowerCase()] || VOICE_POOL.default;

function emotionPreset(emotion = "") {
  const e = emotion.toLowerCase();
  if (e.includes("whisper")) return "Speak in a real whisper: low volume, close-mic intimacy, airy breath, and careful pauses.";
  if (e.includes("shock") || e.includes("stun")) return "Sound genuinely shocked: a tiny breath catch before the first word, uneven pacing, and disbelief in the final phrase.";
  if (e.includes("panic") || e.includes("terrified") || e.includes("fear") || e.includes("dread")) return "Use fear in the body: tense breath, slightly faster pacing, a tremble on key words, and a restrained almost-breaking voice.";
  if (e.includes("grief") || e.includes("tear") || e.includes("breaking") || e.includes("sad")) return "Sound emotionally wounded: slower pace, heavy breath, voice softening and nearly cracking without becoming melodramatic.";
  if (e.includes("joy") || e.includes("relief") || e.includes("warm")) return "Let warmth and relief into the voice: brighter tone, gentle smile, lifted energy, and a small breath of happiness.";
  if (e.includes("angry") || e.includes("furious") || e.includes("accus")) return "Use controlled anger: clipped consonants, tight jaw, sharper emphasis, and pressure building through the line.";
  if (e.includes("suspicious") || e.includes("calm")) return "Keep it restrained and watchful: quiet confidence, measured pacing, and tension under the calm.";
  return "Make the delivery emotionally specific, cinematic, and human, with natural pauses and breath.";
}

function speedForEmotion(emotion = "") {
  const e = emotion.toLowerCase();
  if (e.includes("panic") || e.includes("urgent") || e.includes("angry")) return 1.03;
  if (e.includes("grief") || e.includes("sad") || e.includes("whisper") || e.includes("dread")) return 0.9;
  if (e.includes("shock") || e.includes("stun")) return 0.94;
  return 0.97;
}

// Synthesize one line to an mp3 file. Returns the file path.
export async function performLine(line: SceneLine, outPath: string): Promise<string> {
  let instruction = [
    "Perform this as a premium cinematic audio-drama actor in a scene, not as audiobook narration and not as a robot.",
    "Prioritize believable human feeling over perfect smoothness: breath, hesitation, silence, tension, and emotional texture are desirable.",
    "Do not over-enunciate. Do not use a presenter voice. Do not make every sentence the same rhythm.",
    "If the line contains ellipses, commas, or short fragments, honor them as real pauses and emotional beats.",
    `Speaker: ${line.speaker}. Role: ${line.role || "character"}.`,
    emotionPreset(line.emotion),
    line.voice_instruction || "",
  ].filter(Boolean).join(" ");
  if (line.emotion && !instruction.toLowerCase().includes(line.emotion.toLowerCase())) {
    instruction = `${instruction} Primary emotion: ${line.emotion}.`;
  }
  const res = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: voiceFor(line.role),
    input: line.text,
    instructions: instruction,
    response_format: "mp3",
    speed: speedForEmotion(line.emotion),
  } as never);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}

// Generate a cinematic cover image. Returns the public URL path.
export async function generateCover(coverPrompt: string, outDir: string, id: string): Promise<string> {
  try {
    const res = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: coverPrompt,
      size: "1024x1024",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) return "";
    const file = path.join(outDir, `cover_${id}.png`);
    await fs.writeFile(file, Buffer.from(b64, "base64"));
    return `/media/cover_${id}.png`;
  } catch {
    return ""; // cover is a nice-to-have; never fail the whole scene on it
  }
}
