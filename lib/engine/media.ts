import OpenAI from "openai";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import type { SceneCharacter, SceneLine } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ELEVENLABS_TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL || "eleven_v3";
const ELEVENLABS_TTS_FALLBACK_MODEL = process.env.ELEVENLABS_TTS_FALLBACK_MODEL || "eleven_multilingual_v2";
const ELEVENLABS_OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const FFMPEG_BIN = ffmpegPath || "ffmpeg";

const ELEVENLABS_VOICE_POOL: Record<string, string> = {
  narrator: process.env.ELEVENLABS_NARRATOR_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
  male: process.env.ELEVENLABS_MALE_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
  female: process.env.ELEVENLABS_FEMALE_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
  child: process.env.ELEVENLABS_CHILD_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2",
  villain: process.env.ELEVENLABS_VILLAIN_VOICE_ID || "VR6AewLTigWG4xSOukaG",
  monster: process.env.ELEVENLABS_MONSTER_VOICE_ID || "VR6AewLTigWG4xSOukaG",
  demon: process.env.ELEVENLABS_DEMON_VOICE_ID || "VR6AewLTigWG4xSOukaG",
  ghost: process.env.ELEVENLABS_GHOST_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
  robot: process.env.ELEVENLABS_ROBOT_VOICE_ID || "TxGEqnHWrfWFTfGW9XjX",
  alien: process.env.ELEVENLABS_ALIEN_VOICE_ID || "VR6AewLTigWG4xSOukaG",
  spirit: process.env.ELEVENLABS_SPIRIT_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
  entity: process.env.ELEVENLABS_ENTITY_VOICE_ID || "VR6AewLTigWG4xSOukaG",
  default: process.env.ELEVENLABS_DEFAULT_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
};
const elevenLabsVoiceFor = (role?: string) => ELEVENLABS_VOICE_POOL[(role || "default").toLowerCase()] || ELEVENLABS_VOICE_POOL.default;
const NON_HUMAN_ROLES = new Set(["monster", "demon", "ghost", "robot", "alien", "spirit", "entity"]);

function isNonHuman(line: SceneLine) {
  const haystack = `${line.role || ""} ${line.speaker || ""} ${line.emotion || ""} ${line.voice_instruction || ""}`.toLowerCase();
  return NON_HUMAN_ROLES.has((line.role || "").toLowerCase()) ||
    /\b(monster|creature|beast|demon|ghost|spirit|entity|alien|robot|android|wyrm|dragon|undead|vampire|werewolf)\b/.test(haystack);
}

function speedForEmotion(emotion = "") {
  const e = emotion.toLowerCase();
  if (e.includes("panic") || e.includes("urgent") || e.includes("angry")) return 1.03;
  if (e.includes("grief") || e.includes("sad") || e.includes("whisper") || e.includes("dread")) return 0.9;
  if (e.includes("shock") || e.includes("stun")) return 0.94;
  return 0.97;
}

function elevenLabsSettings(emotion = "", role = "") {
  const e = `${emotion} ${role}`.toLowerCase();
  return {
    stability: e.includes("calm") || e.includes("narrator") ? 0.36 : 0.22,
    similarity_boost: 0.76,
    style: e.includes("shock") || e.includes("panic") || e.includes("fear") || e.includes("cry") || e.includes("grief") || e.includes("joy") || e.includes("angry") || e.includes("monster") ? 0.92 : 0.72,
    use_speaker_boost: true,
    speed: speedForEmotion(emotion),
  };
}

function elevenLabsTags(line: SceneLine) {
  const e = `${line.emotion || ""} ${line.voice_instruction || ""}`.toLowerCase();
  const role = (line.role || "").toLowerCase();
  const tags: string[] = [];
  if (role.includes("robot")) tags.push("[cold mechanical voice]");
  else if (role.includes("ghost") || role.includes("spirit")) tags.push("[hollow whispering]");
  else if (role.includes("monster") || role.includes("demon") || role.includes("alien") || role.includes("entity")) tags.push("[deep guttural growl]");
  if (e.includes("whisper")) tags.push("[whispers]");
  if (e.includes("cry") || e.includes("grief") || e.includes("tear") || e.includes("breaking")) tags.push("[voice breaking]");
  if (e.includes("shock") || e.includes("stun")) tags.push("[gasps]");
  if (e.includes("panic") || e.includes("terrified") || e.includes("fear") || e.includes("dread")) tags.push("[trembling breath]");
  if (e.includes("joy") || e.includes("relief") || e.includes("excited")) tags.push("[laughs softly]");
  if (e.includes("angry") || e.includes("furious")) tags.push("[angry, clenched jaw]");
  if (e.includes("sigh")) tags.push("[sighs]");
  if (line.voice_instruction) tags.push(`[${line.voice_instruction}]`);
  return [...new Set(tags)].slice(0, 4).join(" ");
}

function elevenLabsText(line: SceneLine) {
  const tags = elevenLabsTags(line);
  return [tags, line.text].filter(Boolean).join(" ");
}

async function synthesizeWithElevenLabs(line: SceneLine, outPath: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const voiceId = elevenLabsVoiceFor(line.role);
  const body = {
    text: elevenLabsText(line),
    model_id: ELEVENLABS_TTS_MODEL,
    voice_settings: elevenLabsSettings(line.emotion, line.role),
  };
  let res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${ELEVENLABS_OUTPUT_FORMAT}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && ELEVENLABS_TTS_MODEL !== ELEVENLABS_TTS_FALLBACK_MODEL) {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${ELEVENLABS_OUTPUT_FORMAT}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, text: line.text, model_id: ELEVENLABS_TTS_FALLBACK_MODEL }),
    });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed: ${res.status}${detail ? ` - ${detail.slice(0, 300)}` : ""}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = "";
    p.on("error", (e) => reject(new Error(`${cmd} could not start. ${e.message}`)));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))));
  });
}

async function applyNonHumanVoiceEffect(line: SceneLine, outPath: string): Promise<void> {
  const role = (line.role || "").toLowerCase();
  const rawPath = outPath.replace(/\.mp3$/i, "_raw.mp3");
  const filter = role.includes("robot")
    ? "aecho=0.55:0.45:38:0.22,chorus=0.45:0.75:40:0.35:0.25:2,acompressor=threshold=-18dB:ratio=3:attack=8:release=120"
    : role.includes("ghost") || role.includes("spirit")
      ? "asetrate=44100*0.94,aresample=44100,aecho=0.72:0.45:90:0.38,highpass=f=120,acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180"
      : "asetrate=44100*0.82,aresample=44100,atempo=1.06,aecho=0.62:0.35:48:0.22,acompressor=threshold=-18dB:ratio=4:attack=8:release=160";
  await fs.rename(outPath, rawPath);
  try {
    await run(FFMPEG_BIN, ["-y", "-i", rawPath, "-af", filter, "-ar", "44100", "-ac", "2", "-b:a", "192k", outPath]);
  } catch (error) {
    await fs.rename(rawPath, outPath).catch(() => {});
    throw error;
  } finally {
    fs.rm(rawPath, { force: true }).catch(() => {});
  }
}

// Synthesize one line to an mp3 file. Returns the file path.
export async function performLine(line: SceneLine, outPath: string): Promise<string> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY. Speech generation is configured for ElevenLabs only.");
  }
  const nonHuman = isNonHuman(line);
  await synthesizeWithElevenLabs(line, outPath);
  if (nonHuman) await applyNonHumanVoiceEffect(line, outPath);
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

export async function generateCharacterPortrait(character: SceneCharacter, outDir: string, sceneId: string, index: number): Promise<string> {
  try {
    const res = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: [
        character.portrait_prompt,
        character.appearance,
        "Cinematic vertical character portrait, expressive face, dramatic lighting, no text, no letters, no watermark.",
      ].join(" "),
      size: "1024x1024",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) return "";
    const file = path.join(outDir, `portrait_${sceneId}_${index}.png`);
    await fs.writeFile(file, Buffer.from(b64, "base64"));
    return `/media/portrait_${sceneId}_${index}.png`;
  } catch {
    return "";
  }
}

export async function generateLineFrame(
  line: SceneLine,
  character: SceneCharacter | undefined,
  sceneMood: string,
  outDir: string,
  sceneId: string,
  index: number
): Promise<string> {
  try {
    const res = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: [
        "Graphic novel story panel, cinematic but illustrated, dramatic inked lighting, expressive face and body language.",
        `Mood: ${sceneMood}. Speaker: ${line.speaker}. Emotion/expression: ${line.expression || line.emotion}.`,
        character?.appearance ? `Keep this character consistent: ${character.appearance}.` : "",
        line.visual_prompt || "",
        "Show the feeling clearly and naturally: fear in eyes and posture, joy in face and shoulders, anger in jaw and stance, grief in eyes and breath.",
        "No readable text, no speech bubbles, no letters, no watermark.",
      ].filter(Boolean).join(" "),
      size: "1024x1024",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) return "";
    const file = path.join(outDir, `frame_${sceneId}_${index}.png`);
    await fs.writeFile(file, Buffer.from(b64, "base64"));
    return `/media/frame_${sceneId}_${index}.png`;
  } catch {
    return "";
  }
}
