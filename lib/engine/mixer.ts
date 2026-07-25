import { spawn } from "child_process";
import { promises as fs } from "fs";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import path from "path";
import type { SceneLine } from "../types";

const AMBIENCE_GAIN_DB = -9;
const FFMPEG_BIN = ffmpegPath || "ffmpeg";
const FFPROBE_BIN = ffprobeStatic.path || "ffprobe";

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = "";
    p.on("error", (e) => reject(new Error(`${cmd} could not start. Make sure ffmpeg is installed and available on PATH. ${e.message}`)));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))));
  });
}

async function ffprobeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const p = spawn(FFPROBE_BIN, ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    let out = "";
    p.on("error", (e) => reject(new Error(`ffprobe could not start. Make sure ffmpeg is installed and available on PATH. ${e.message}`)));
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => resolve(parseFloat(out.trim()) || 0));
  });
}

export async function assertAudioToolsAvailable(): Promise<void> {
  await Promise.all([
    run(FFMPEG_BIN, ["-version"]),
    new Promise<void>((resolve, reject) => {
      const p = spawn(FFPROBE_BIN, ["-version"]);
      p.on("error", (e) => reject(new Error(`ffprobe could not start. Make sure ffmpeg is installed and available on PATH. ${e.message}`)));
      p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffprobe exited ${code}`))));
    }),
  ]);
}

/**
 * Mix voice clips (with per-line pauses) over a looping ambience bed.
 * 1. Build the voice track: each clip followed by a silence gap.
 * 2. Loop the ambience to cover the full voice length, lower its volume.
 * 3. Overlay (amix) and export a single mp3.
 */
export async function mixScene(
  voiceClips: { path: string; pauseMs: number }[],
  ambiencePath: string,
  outPath: string,
  workDir: string,
  sfxClips: { path: string; lineIndex: number; offsetMs: number; gainDb: number }[] = []
): Promise<string> {
  // Step 1: create a padded version of each voice clip (clip + trailing silence),
  // then concat them into one voice track.
  const paddedList: string[] = [];
  const lineStartMs: number[] = [];
  let cursorMs = 0;
  for (let i = 0; i < voiceClips.length; i++) {
    const { path: clip, pauseMs } = voiceClips[i];
    lineStartMs[i] = cursorMs;
    const clipLenMs = Math.round((await ffprobeDuration(clip)) * 1000);
    const padded = path.join(workDir, `padded_${i}.mp3`);
    // apad adds silence; pad_dur is seconds
    await run(FFMPEG_BIN, [
      "-y", "-i", clip,
      "-af", `apad=pad_dur=${(pauseMs / 1000).toFixed(3)}`,
      "-ar", "44100", "-ac", "2",
      padded,
    ]);
    paddedList.push(padded);
    cursorMs += clipLenMs + pauseMs;
  }

  // concat the padded clips
  const concatFile = path.join(workDir, "concat.txt");
  await fs.writeFile(concatFile, paddedList.map((p) => `file '${p}'`).join("\n"));
  const voiceTrack = path.join(workDir, "voice.mp3");
  await run(FFMPEG_BIN, ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", voiceTrack]);

  const voiceLen = await ffprobeDuration(voiceTrack);
  const total = Math.max(voiceLen + 2.2, 58);

  // Step 2 + 3: loop ambience to cover total, duck it under voices, place timed SFX,
  // then overlay everything into one cinematic mix.
  // -stream_loop -1 loops the ambience; -t caps the whole output to `total`.
  const sfxInputs = sfxClips.flatMap((sfx) => ["-i", sfx.path]);
  const sfxFilters = sfxClips.map((sfx, i) => {
    const inputIndex = i + 2;
    const startMs = Math.max(0, (lineStartMs[sfx.lineIndex] || 0) + sfx.offsetMs);
    return `[${inputIndex}:a]volume=${sfx.gainDb}dB,adelay=${startMs}|${startMs},apad=whole_dur=${total.toFixed(2)}[sfx${i}]`;
  });
  const mixInputs = ["[voice]", "[amb]", ...sfxClips.map((_, i) => `[sfx${i}]`)].join("");
  const filterComplex = [
    `[0:a]apad=whole_dur=${total.toFixed(2)},asplit=2[voice][ducksrc]`,
    `[1:a]volume=${AMBIENCE_GAIN_DB}dB,afade=t=in:st=0:d=0.8,afade=t=out:st=${(total - 1.6).toFixed(2)}:d=1.6[ambraw]`,
    "[ambraw][ducksrc]sidechaincompress=threshold=0.025:ratio=7:attack=80:release=900:makeup=1[amb]",
    ...sfxFilters,
    `${mixInputs}amix=inputs=${2 + sfxClips.length}:duration=longest:dropout_transition=0:normalize=0[out]`,
  ].join(";");

  await run(FFMPEG_BIN, [
    "-y",
    "-i", voiceTrack,
    "-stream_loop", "-1", "-i", ambiencePath,
    ...sfxInputs,
    "-filter_complex",
    filterComplex,
    "-map", "[out]",
    "-t", total.toFixed(2),
    "-ar", "44100", "-ac", "2", "-b:a", "192k",
    outPath,
  ]);

  return outPath;
}




