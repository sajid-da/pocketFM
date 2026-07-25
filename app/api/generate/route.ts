import { NextRequest, NextResponse } from "next/server";
import { produceScene } from "@/lib/engine/pipeline";
import { saveSceneServer } from "@/lib/store";

export const maxDuration = 240; // 60-second scene generation can take several minutes

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A premise is required." }, { status: 400 });
    }
    const scene = await produceScene(prompt);
    await saveSceneServer(scene);   // persist immediately
    return NextResponse.json(scene);
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Generation failed.";
    const msg =
      raw === "Connection error." || raw.toLowerCase().includes("fetch failed")
        ? "Could not connect to the AI providers. Check your internet, firewall, VPN/proxy, and API access to api.openai.com and api.elevenlabs.io."
        : raw;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
