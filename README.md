# EchoVerse — AI Audio Drama Platform

ONE unified Next.js application. Viewer + Creator Studio in a single app,
one design system, one nav. Netflix-style home, Discover, Library, Studio,
and an in-app Creator flow — you never leave the app.

## What it does
Type a premise → the app generates a full 30–60s audio-drama scene:
- **Script + direction** — OpenAI (structured, performable, per-line emotion)
- **Voices** — ElevenLabs TTS only, with emotion tags and role-based voices
- **Cover art** — OpenAI image API (cinematic poster per scene, shown on cards)
- **Atmosphere** — ElevenLabs sound-generation (looping ambience bed)
- **Mix** — ffmpeg stitches voices with pauses and ducks the ambience under them

Everything runs inside Next.js API routes. No separate backend.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Framer Motion · lucide-react
OpenAI SDK · ElevenLabs REST · ffmpeg (system binary)

## Requirements
- Node 18+
- **ffmpeg** installed and on PATH (`ffmpeg -version` to check)
- OpenAI + ElevenLabs API keys

## Voice setup
ElevenLabs is the recommended speech engine for emotional acting.

```bash
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_TTS_FALLBACK_MODEL=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

Optional voice overrides:

```bash
ELEVENLABS_NARRATOR_VOICE_ID=...
ELEVENLABS_MALE_VOICE_ID=...
ELEVENLABS_FEMALE_VOICE_ID=...
ELEVENLABS_VILLAIN_VOICE_ID=...
ELEVENLABS_MONSTER_VOICE_ID=...
```

## Run
```bash
npm install
cp .env.local.example .env.local     # paste your two API keys
npm run dev                          # -> http://localhost:3000
```
Generate a scene from Create (or the floating ✦ button). It plays, gets a
cover, and is saved to data/scenes.json — refresh and your Library persists.

## Structure
```
app/
  page.tsx              # single app shell, all views + routing
  components/           # Sidebar, HomeView, CreateView, PlayerView, SceneCard, Waveform
  api/generate/route.ts # runs the full generation pipeline
  api/scenes/route.ts   # JSON persistence
lib/
  engine/               # director, media (voice+cover), atmosphere, mixer, pipeline
  store.ts  types.ts  api.ts
public/media/           # generated audio + covers (served at /media)
data/scenes.json        # the "database"
```

## Roadmap (structured for, stubbed now)
Auth/roles, real-time viewer↔creator sync, comments, voice search,
multi-episode story bible, character memory. Components are structured to
accept these; they're pitch-slide items, not built for the demo.
