// Shared types for EchoVerse scene data

export interface SceneLine {
  speaker: string;
  role?: string;
  text: string;
  emotion?: string;
  voice_instruction?: string;
  expression?: string;
  visual_prompt?: string;
  portrait_url?: string;
  pause_after_ms?: number;
}

export interface SceneCharacter {
  name: string;
  role?: string;
  appearance: string;
  portrait_prompt: string;
  portrait_url?: string;
}

export interface Scene {
  id: string;
  title: string;
  mood: string;
  ambience: string;
  cover_url: string;      // OpenAI-generated cover, "" if none
  characters?: SceneCharacter[];
  lines: SceneLine[];
  audio_url: string;
  created_at: number;
}
