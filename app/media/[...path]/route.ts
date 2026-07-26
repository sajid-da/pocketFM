import { promises as fs } from "fs";
import path from "path";
import { NextRequest } from "next/server";

const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), "data", "media");

const CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const requested = path.join(MEDIA_DIR, ...parts);
  const resolved = path.resolve(requested);
  const root = path.resolve(MEDIA_DIR);

  if (!resolved.startsWith(root + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(resolved);
    const type = CONTENT_TYPES[path.extname(resolved).toLowerCase()] || "application/octet-stream";
    return new Response(file, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
