// Shared types for EchoVerse scene data

export interface SceneLine {
  speaker: string;
  role?: string;
  text: string;
  emotion?: string;
  voice_instruction?: string;
  pause_after_ms?: number;
}

export interface Scene {
  id: string;
  title: string;
  mood: string;
  ambience: string;
  cover_url: string;      // OpenAI-generated cover, "" if none
  lines: SceneLine[];
  audio_url: string;
  created_at: number;
}
