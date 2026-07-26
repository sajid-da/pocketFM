import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { directScene } from "./director";
import { performLine, generateCharacterPortrait, generateCover, generateLineFrame } from "./media";
import { generateAmbience, generateSoundEffect } from "./atmosphere";
import { assertAudioToolsAvailable, mixScene } from "./mixer";
import type { Scene } from "../types";
import type { DirectedScene, SoundEvent } from "./director";

// Public media dir served at /media (see next.config + route)
const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const NON_HUMAN_ROLES = new Set(["monster", "demon", "ghost", "robot", "alien", "spirit", "entity"]);

function isNonHumanRole(role = "", speaker = "") {
  const text = `${role} ${speaker}`.toLowerCase();
  return NON_HUMAN_ROLES.has(role.toLowerCase()) ||
    /\b(monster|creature|beast|demon|ghost|spirit|entity|alien|robot|android|dragon|undead|vampire|werewolf)\b/.test(text);
}

function automaticEntitySfx(scene: DirectedScene): SoundEvent[] {
  const events: SoundEvent[] = [];
  const usedLineIndexes = new Set<number>();
  scene.lines.forEach((line, index) => {
    if (!isNonHumanRole(line.role, line.speaker) || usedLineIndexes.has(index) || events.length >= 3) return;
    usedLineIndexes.add(index);
    const role = (line.role || "entity").toLowerCase();
    const prompt = role.includes("robot")
      ? `close mechanical servo twitch and low synthetic vocal buzz before ${line.speaker} speaks, no words, no dialogue`
      : role.includes("ghost") || role.includes("spirit")
        ? `close spectral inhale and hollow whispery breath before ${line.speaker} speaks, no words, no dialogue`
        : `close wet monstrous breath and restrained throat growl before ${line.speaker} speaks, no words, no dialogue`;
    events.push({
      line_index: index,
      offset_ms: -650,
      prompt,
      duration_ms: 2400,
      gain_db: -4,
    });
  });
  return events;
}

function buildSoundEvents(scene: DirectedScene): SoundEvent[] {
  const seen = new Set<string>();
  return [...(scene.sound_events || []), ...automaticEntitySfx(scene)]
    .filter((event) => event.prompt && Number.isFinite(event.line_index))
    .filter((event) => {
      const key = `${event.line_index}:${event.prompt.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 9);
}

export async function produceScene(prompt: string): Promise<Scene> {
  await assertAudioToolsAvailable();

  const id = randomUUID();
  const workDir = path.join(MEDIA_DIR, "_work", id);
  await fs.mkdir(workDir, { recursive: true });
  await fs.mkdir(MEDIA_DIR, { recursive: true });

  // 1. Direct the scene
  const directed = await directScene(prompt);

  // 2. Perform voices + generate cover/SFX in parallel with ambience
  const voiceClips: { path: string; pauseMs: number }[] = [];
  const voicePromise = (async () => {
    for (let i = 0; i < directed.lines.length; i++) {
      const p = path.join(workDir, `line_${i}.mp3`);
      await performLine(directed.lines[i], p);
      voiceClips.push({ path: p, pauseMs: directed.lines[i].pause_after_ms || 350 });
    }
  })();

  const ambiencePath = path.join(workDir, "ambience.mp3");
  const ambiencePromise = generateAmbience(directed.ambience_prompt, ambiencePath, 22);
  const coverPromise = generateCover(directed.cover_prompt, MEDIA_DIR, id);
  const portraitPromise = Promise.all(
    (directed.characters || []).map(async (character, i) => ({
      ...character,
      portrait_url: await generateCharacterPortrait(character, MEDIA_DIR, id, i),
    }))
  );

  await Promise.all([voicePromise, ambiencePromise]);
  const sfxClips: { path: string; lineIndex: number; offsetMs: number; gainDb: number }[] = [];
  const soundEvents = buildSoundEvents(directed);
  for (let i = 0; i < soundEvents.length; i++) {
    const event = soundEvents[i];
    const sfxPath = path.join(workDir, `sfx_${i}.mp3`);
    await generateSoundEffect(event.prompt, sfxPath, event.duration_ms / 1000).catch((error) => {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not generate ElevenLabs SFX "${event.prompt}": ${reason}`);
    });
    sfxClips.push({
      path: sfxPath,
      lineIndex: event.line_index,
      offsetMs: event.offset_ms,
      gainDb: event.gain_db ?? -7,
    });
  }
  const coverUrl = await coverPromise;
  const characters = await portraitPromise;
  const characterBySpeaker = new Map(characters.map((character) => [character.name.toLowerCase(), character]));
  const frameUrls = await Promise.all(
    directed.lines.map((line, i) => generateLineFrame(line, characterBySpeaker.get(line.speaker.toLowerCase()), directed.mood, MEDIA_DIR, id, i))
  );
  directed.lines.forEach((line, i) => {
    const character = characterBySpeaker.get(line.speaker.toLowerCase());
    line.portrait_url = frameUrls[i] || character?.portrait_url || coverUrl;
  });

  // 3. Mix
  const finalPath = path.join(MEDIA_DIR, `scene_${id}.mp3`);
  await mixScene(voiceClips, ambiencePath, finalPath, workDir, sfxClips);

  // 4. cleanup work dir (best-effort)
  fs.rm(workDir, { recursive: true, force: true }).catch(() => {});

  return {
    id,
    title: directed.title,
    mood: directed.mood,
    ambience: directed.ambience_prompt,
    cover_url: coverUrl,
    characters,
    lines: directed.lines,
    audio_url: `/media/scene_${id}.mp3`,
    created_at: Date.now(),
  };
}
