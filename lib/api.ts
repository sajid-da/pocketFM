import type { Scene } from "./types";

const MOOD_COLORS: Record<string, [string, string]> = {
  tense: ["#3a1230", "#7a2148"], eerie: ["#0f2438", "#1f3d6b"],
  tender: ["#3a2818", "#7a5223"], dark: ["#181530", "#2c2560"],
  horror: ["#2a0f1a", "#5c1a2e"], romance: ["#3a1230", "#7a2150"],
  mystery: ["#14203a", "#243a6b"], adventure: ["#153020", "#276b45"],
  sad: ["#1a2030", "#2c3a5c"], default: ["#241c42", "#3d2f7a"],
};
export function moodGradient(mood?: string): string {
  const key = (mood || "").toLowerCase().split(/[ ,]/)[0];
  const [a, b] = MOOD_COLORS[key] || MOOD_COLORS.default;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export async function generateScene(prompt: string): Promise<Scene> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240_000);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : { error: `Server returned ${res.status} instead of JSON. Check deployment logs and environment variables.` };
    if (!res.ok || data.error) throw new Error(data.error || "Generation failed.");
    return data as Scene;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Generation timed out. Check the server logs and try a shorter scene.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadScenes(): Promise<Scene[]> {
  try {
    const res = await fetch("/api/scenes", { cache: "no-store" });
    return res.ok ? ((await res.json()) as Scene[]) : [];
  } catch {
    return [];
  }
}
