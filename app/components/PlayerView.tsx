"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ImageIcon, MessageSquareText, Radio } from "lucide-react";
import type { Scene } from "@/lib/types";
import { moodGradient } from "@/lib/api";
import { Waveform } from "./Waveform";

export function PlayerView({ scene, onBack }: { scene: Scene; onBack: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const cueTimes = useMemo(() => buildCueTimes(scene), [scene]);
  const activeIndex = cueTimes.findLastIndex((cue) => currentTime >= cue.start);
  const activeLine = scene.lines[Math.max(activeIndex, 0)] || scene.lines[0];
  const visualUrl = activeLine?.portrait_url || scene.cover_url;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen overflow-hidden max-[860px]:-mx-[18px]">
      <div className="relative px-11 py-8 max-[860px]:px-[18px]">
        <div className="pointer-events-none absolute inset-0" style={{ background: moodGradient(scene.mood) }}>
          {scene.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.cover_url} alt="" className="cinema-bg h-full w-full object-cover opacity-65" />
          ) : (
            <div className="hero-texture h-full w-full" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.74)_50%,#050505_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,transparent,#050505)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1220px]">
          <button onClick={onBack} className="mb-8 inline-flex items-center gap-[7px] rounded bg-white/10 px-4 py-2 text-[13.5px] font-bold text-white/74 ring-1 ring-white/10 transition hover:bg-white/16 hover:text-white">
            <ArrowLeft size={15} /> Back to home
          </button>

          <div className="grid grid-cols-[minmax(0,1fr)_480px] gap-7 max-[1100px]:grid-cols-1">
            <section className="glass-panel rounded p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded bg-[#e50914] px-3 py-1 text-[11px] font-black uppercase tracking-[2px] text-white">
                <Radio size={14} /> Visual Story
              </div>
              <h1 className="text-[clamp(42px,6vw,76px)] font-black leading-[.9] text-white">{scene.title}</h1>
              <div className="mt-5 flex flex-wrap gap-[10px]">
                <span className="rounded bg-white/12 px-[13px] py-[6px] text-[11.5px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/10">
                  {scene.mood || "scene"}
                </span>
                <span className="rounded bg-white/12 px-[13px] py-[6px] text-[11.5px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/10">{scene.lines.length} lines | visual audio drama</span>
              </div>

              <div className="my-8 h-[84px]"><Waveform count={68} playing={playing} /></div>
              <audio
                ref={audioRef}
                controls
                autoPlay
                src={scene.audio_url}
                className="w-full"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />

              <ActiveDialogue line={activeLine} mood={scene.mood} />
            </section>

            <aside className="glass-panel overflow-hidden rounded">
              <div className="relative h-[560px] max-[1100px]:h-[460px]">
                {visualUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <motion.img
                    key={`${activeIndex}-${visualUrl}`}
                    src={visualUrl}
                    alt={activeLine?.speaker || scene.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="cinema-bg h-full w-full object-cover"
                  />
                ) : (
                  <div className="poster-fallback h-full w-full" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,.86)_100%)]" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded bg-black/58 px-3 py-[7px] text-[11px] font-black uppercase tracking-[1.8px] text-white/72 ring-1 ring-white/10 backdrop-blur">
                  <ImageIcon size={14} /> Generated Frame
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="text-[13px] font-black uppercase tracking-[2px] text-white/52">{activeLine?.emotion || scene.mood}</div>
                  <div className="mt-1 text-[30px] font-black leading-none text-white">{activeLine?.speaker || "Scene"}</div>
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-3 text-[12px] font-black uppercase tracking-[2px] text-white/46">
              <MessageSquareText size={16} className="text-[#e50914]" /> Dialogue Storyboard
            </div>
            <div className="grid gap-3">
            {scene.lines.map((l, i) => {
              const active = i === Math.max(activeIndex, 0);
              const thumbUrl = l.portrait_url || scene.cover_url;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.35 }}
                  className="glass-panel grid grid-cols-[86px_120px_minmax(0,1fr)] gap-4 rounded p-4 transition max-[760px]:grid-cols-[72px_minmax(0,1fr)]"
                  style={{ borderColor: active ? "rgba(229,9,20,.7)" : "rgba(255,255,255,.1)", boxShadow: active ? "0 0 0 1px rgba(229,9,20,.35), 0 18px 70px rgba(229,9,20,.12)" : undefined }}>
                  <div className="relative h-[86px] overflow-hidden rounded bg-white/7 ring-1 ring-white/10 max-[760px]:h-[72px]">
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="poster-fallback h-full w-full" />
                    )}
                    {active && <div className="absolute inset-0 ring-2 ring-inset ring-[#e50914]" />}
                  </div>
                  <div className="max-[760px]:col-start-2">
                    <div className="text-[13.5px] font-black text-white">{l.speaker}</div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[1.4px] text-white/42">{l.role || "voice"}</div>
                  </div>
                  <div className="max-[760px]:col-span-2">
                    <div className="text-[15px] leading-7 text-white/84">{l.text}</div>
                    {(l.expression || l.emotion) && (
                      <span className="mt-3 inline-block rounded bg-[#e50914]/14 px-[10px] py-1 text-[10.5px] font-bold uppercase tracking-wide text-red-100 ring-1 ring-[#e50914]/25">{l.expression || l.emotion}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveDialogue({ line, mood }: { line: Scene["lines"][number] | undefined; mood: string }) {
  return (
    <div className="mt-7 grid grid-cols-[132px_minmax(0,1fr)] overflow-hidden rounded bg-black/32 ring-1 ring-white/10 max-[680px]:grid-cols-1">
      <div className="border-r border-white/10 bg-white/[.04] p-5 max-[680px]:border-b max-[680px]:border-r-0">
        <div className="text-[11px] font-black uppercase tracking-[2px] text-white/42">Now Speaking</div>
        <div className="mt-3 text-[18px] font-black leading-tight text-white">{line?.speaker || "Narrator"}</div>
        <div className="mt-3 inline-flex rounded bg-[#e50914]/16 px-3 py-1 text-[10.5px] font-black uppercase tracking-[1.5px] text-red-100 ring-1 ring-[#e50914]/25">
          {line?.expression || line?.emotion || mood}
        </div>
      </div>
      <div className="p-5">
        <p className="text-[24px] font-black leading-snug text-white max-[680px]:text-[19px]">{line?.text}</p>
        {line?.visual_prompt && (
          <p className="mt-4 line-clamp-2 text-[12.5px] leading-5 text-white/42">{line.visual_prompt}</p>
        )}
      </div>
    </div>
  );
}

function buildCueTimes(scene: Scene) {
  let cursor = 0;
  return scene.lines.map((line) => {
    const words = line.text.trim().split(/\s+/).filter(Boolean).length;
    const spokenSeconds = Math.max(2.4, words * 0.42);
    const start = cursor;
    cursor += spokenSeconds + (line.pause_after_ms || 700) / 1000;
    return { start };
  });
}
