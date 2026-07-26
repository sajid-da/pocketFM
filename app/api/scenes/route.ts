import { NextRequest, NextResponse } from "next/server";
import { readScenes, saveSceneServer } from "@/lib/store";
import type { Scene } from "@/lib/types";

export async function GET() {
  const scenes = await readScenes();
  scenes.sort((a, b) => b.created_at - a.created_at);
  return NextResponse.json(scenes);
}

export async function POST(req: NextRequest) {
  const scene = await req.json();
  if (!isScene(scene)) {
    return NextResponse.json({ error: "Invalid scene payload." }, { status: 400 });
  }
  await saveSceneServer(scene);
  return NextResponse.json({ ok: true });
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.mood === "string" &&
    typeof value.ambience === "string" &&
    typeof value.cover_url === "string" &&
    typeof value.audio_url === "string" &&
    typeof value.created_at === "number" &&
    (value.characters === undefined || (Array.isArray(value.characters) && value.characters.every(isSceneCharacter))) &&
    Array.isArray(value.lines) &&
    value.lines.every(isSceneLine)
  );
}

function isSceneLine(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.speaker === "string" &&
    typeof value.text === "string" &&
    optionalString(value.role) &&
    optionalString(value.emotion) &&
    optionalString(value.voice_instruction) &&
    optionalString(value.expression) &&
    optionalString(value.visual_prompt) &&
    optionalString(value.portrait_url) &&
    (value.pause_after_ms === undefined || typeof value.pause_after_ms === "number")
  );
}

function isSceneCharacter(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    optionalString(value.role) &&
    typeof value.appearance === "string" &&
    typeof value.portrait_prompt === "string" &&
    optionalString(value.portrait_url)
  );
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
