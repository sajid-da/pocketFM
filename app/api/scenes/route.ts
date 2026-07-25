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
    (value.pause_after_ms === undefined || typeof value.pause_after_ms === "number")
  );
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
