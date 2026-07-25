import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { directScene } from "./director";
import { performLine, generateCover } from "./media";
import { generateAmbience, generateSoundEffect } from "./atmosphere";
import { assertAudioToolsAvailable, mixScene } from "./mixer";
import type { Scene } from "../types";

// Public media dir served at /media (see next.config + route)
const MEDIA_DIR = path.join(process.cwd(), "public", "media");

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
  const sfxPromise = Promise.all(
    (directed.sound_events || []).map(async (event, i) => {
      const sfxPath = path.join(workDir, `sfx_${i}.mp3`);
      await generateSoundEffect(event.prompt, sfxPath, event.duration_ms / 1000);
      return {
        path: sfxPath,
        lineIndex: event.line_index,
        offsetMs: event.offset_ms,
        gainDb: event.gain_db ?? -7,
      };
    })
  ).catch(() => []);

  await Promise.all([voicePromise, ambiencePromise]);
  const sfxClips = await sfxPromise;
  const coverUrl = await coverPromise;

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
    lines: directed.lines,
    audio_url: `/media/scene_${id}.mp3`,
    created_at: Date.now(),
  };
}
