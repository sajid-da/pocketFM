import OpenAI from "openai";
import type { SceneCharacter, SceneLine } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const SCENE_MODEL = process.env.SCENE_MODEL || "gpt-4o";

export interface DirectedScene {
  title: string;
  mood: string;
  ambience_prompt: string;
  cover_prompt: string;
  characters?: SceneCharacter[];
  lines: SceneLine[];
  sound_events?: SoundEvent[];
}

export interface SoundEvent {
  line_index: number;
  offset_ms: number;
  prompt: string;
  duration_ms: number;
  gain_db?: number;
}

const SYSTEM = `You are a cinematic audio-drama director for an immersive
storytelling app (like Pocket FM). Given a premise, characters, and setting,
write a 55-65 second performed scene and direct how it is acted.

Return ONLY valid JSON in this exact shape:
{
  "title": "short scene title",
  "mood": "one or two words, e.g. tense, eerie, tender",
  "ambience_prompt": "detailed ElevenLabs sound-generation prompt for a CONTINUOUS loopable background sound bed. Include every environmental sound implied by the script, e.g. heavy rain, tin roof, distant thunder, wet footsteps, old wood creaking. Keep it steady and loopable, with no music and no voices.",
  "cover_prompt": "a cinematic movie-poster image description for this scene: setting, mood, lighting, atmosphere. NO text, NO letters, NO watermarks. Dramatic, film-still quality.",
  "characters": [
    {
      "name": "character name, excluding Narrator unless narrator is visible",
      "role": one of ["male","female","child","villain","narrator"],
      "appearance": "consistent visual description: age, face, hair, clothing, distinguishing details",
      "portrait_prompt": "cinematic portrait prompt for this character, no text, no watermark, expressive face, matching story genre"
    }
  ],
  "lines": [
    {
      "speaker": "Narrator" or character name,
      "role": one of ["narrator","male","female","child","villain"],
      "text": "the spoken line. Use natural, dramatic spoken language with punctuation that helps performance: ellipses for hesitation, short broken sentences for fear, exclamation only when truly needed. Do not include bracketed stage directions in text.",
      "emotion": "specific actable emotion, e.g. shocked whisper, breaking grief, restrained panic, suspicious calm, trembling dread, fragile joy, angry disbelief",
      "voice_instruction": "very specific delivery direction for TTS: start/end volume, pace, breath, pauses, tension, and how the emotion changes during the line. Use words like whisper, gasp, trembling, breathless, tearful, stunned, warm, urgent, furious when appropriate.",
      "expression": "visible facial/body expression for the player, e.g. wide-eyed shock, tearful restraint, forced smile, furious stare",
      "visual_prompt": "short visual shot prompt for this exact line: who is visible, expression, lighting, camera angle, background. NO readable text.",
      "pause_after_ms": integer 400-1800 (longer BEFORE a shock -- silence sells surprise)
    }
  ],
  "sound_events": [
    {
      "line_index": integer index of the line this sound should start near,
      "offset_ms": integer offset from the start of that line, usually 0-2500,
      "prompt": "short ElevenLabs SFX prompt, e.g. 'three sharp knocks on an old wooden cellar door', 'single distant thunder crack', 'wet footsteps on stone path'",
      "duration_ms": integer 1200-6000,
      "gain_db": integer -12 to -3
    }
  ]
}
Rules:
- 10-14 lines total so the final mixed audio lands around 60 seconds.
- Open with sensory narration that names the environment sounds.
- Include at least 3 dramatic turns: hesitation, discovery, confrontation, confession, or shock.
- Vary emotion and pacing between lines; avoid flat neutral delivery.
- Every voice_instruction must be actable and concrete. Bad: 'sad'. Good: 'start as a low exhausted whisper, voice almost breaking on the last word, then hold a half-second silence.'
- Give emotional lines room to breathe: use short phrases, commas, ellipses, and pauses instead of long formal sentences.
- Narrator should sound like a storyteller inside the scene, not a newsreader.
- Create a character entry for every speaking character except generic Narrator. Keep character appearance consistent across the whole scene.
- Every non-narrator line must include expression and visual_prompt. Narrator lines should include a shot prompt for the environment or the person being described.
- If the premise mentions rain, crowds, wind, machines, fire, doors, footsteps, temples, radios, forests, etc., those sounds MUST appear in ambience_prompt.
- Add 2-5 sound_events for important one-off sounds that must be heard clearly: knocks, thunder cracks, doors, footsteps, glass breaking, radios, screams in distance, weapons, magic bursts. Do not put continuous rain/wind/crowd bed in sound_events; that belongs in ambience_prompt.
- Time sound_events around the script. Example: a knock should happen just before a character reacts to it; thunder can hit after a shocking line.
- Keep 'role' consistent per character.`;

export async function directScene(prompt: string): Promise<DirectedScene> {
  const res = await openai.chat.completions.create({
    model: SCENE_MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });
  const scene = JSON.parse(res.choices[0].message.content || "{}") as DirectedScene;
  if (!scene.lines?.length) throw new Error("Scene director returned no lines");
  scene.lines.forEach((l) => {
    l.role ||= "narrator";
    l.emotion ||= "cinematic tension";
    l.voice_instruction ||= "acted audio-drama performance with natural breath, emotional emphasis, and varied pace";
    l.expression ||= l.emotion || "cinematic focus";
    l.visual_prompt ||= `${l.speaker} ${l.expression}, cinematic close-up, ${scene.mood} mood`;
    l.pause_after_ms = Math.min(Math.max(l.pause_after_ms || 700, 400), 1800);
  });
  scene.characters = (scene.characters || [])
    .filter((character) => character.name && character.portrait_prompt)
    .slice(0, 6)
    .map((character) => ({
      ...character,
      role: character.role || "default",
      appearance: character.appearance || character.portrait_prompt,
    }));
  scene.sound_events = (scene.sound_events || [])
    .filter((event) => event.prompt && Number.isFinite(event.line_index))
    .slice(0, 5)
    .map((event) => ({
      ...event,
      line_index: Math.min(Math.max(Math.round(event.line_index), 0), scene.lines.length - 1),
      offset_ms: Math.min(Math.max(Math.round(event.offset_ms || 0), 0), 4000),
      duration_ms: Math.min(Math.max(Math.round(event.duration_ms || 3000), 1200), 6000),
      gain_db: Math.min(Math.max(Math.round(event.gain_db ?? -7), -12), -3),
    }));
  return scene;
}

