import { promises as fs } from "fs";
import path from "path";
import type { Scene } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "scenes.json");
let saveQueue = Promise.resolve();

export async function readScenes(): Promise<Scene[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as Scene[];
  } catch {
    return [];
  }
}

export async function writeScenes(scenes: Scene[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(scenes, null, 2), "utf-8");
}

export async function saveSceneServer(scene: Scene): Promise<void> {
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const scenes = await readScenes();
    if (!scenes.some((s) => s.id === scene.id)) {
      scenes.push(scene);
      await writeScenes(scenes);
    }
  });
  return saveQueue;
}
