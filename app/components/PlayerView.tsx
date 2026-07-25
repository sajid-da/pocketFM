"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Radio } from "lucide-react";
import type { Scene } from "@/lib/types";
import { moodGradient } from "@/lib/api";
import { Waveform } from "./Waveform";

export function PlayerView({ scene, onBack }: { scene: Scene; onBack: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen overflow-hidden max-[860px]:-mx-[18px]">
      <div className="relative px-11 py-8 max-[860px]:px-[18px]">
        <div className="pointer-events-none absolute inset-0" style={{ background: moodGradient(scene.mood) }}>
          {scene.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.cover_url} alt="" className="cinema-bg h-full w-full object-cover opacity-75" />
          ) : (
            <div className="hero-texture h-full w-full" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.72)_52%,#050505_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,transparent,#050505)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1180px]">
          <button onClick={onBack} className="mb-8 inline-flex items-center gap-[7px] rounded bg-white/10 px-4 py-2 text-[13.5px] font-bold text-white/74 ring-1 ring-white/10 transition hover:bg-white/16 hover:text-white">
            <ArrowLeft size={15} /> Back to home
          </button>

          <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-7 max-[980px]:grid-cols-1">
            <section className="glass-panel rounded p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded bg-[#e50914] px-3 py-1 text-[11px] font-black uppercase tracking-[2px] text-white">
                <Radio size={14} /> Now Playing
              </div>
              <h1 className="text-[clamp(42px,6vw,76px)] font-black leading-[.9] text-white">{scene.title}</h1>
              <div className="mt-5 flex flex-wrap gap-[10px]">
                <span className="rounded bg-white/12 px-[13px] py-[6px] text-[11.5px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/10">
                  {scene.mood || "scene"}
                </span>
                <span className="rounded bg-white/12 px-[13px] py-[6px] text-[11.5px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/10">{scene.lines.length} lines | audio drama</span>
              </div>
              {scene.ambience && (
                <div className="mt-6 border-l-2 border-[#e50914]/60 pl-4 text-[14.5px] italic leading-7 text-white/64">
                  Atmosphere: {scene.ambience}
                </div>
              )}
              <div className="my-8 h-[84px]"><Waveform count={68} playing={playing} /></div>
              <audio
                ref={audioRef}
                controls
                autoPlay
                src={scene.audio_url}
                className="w-full"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
            </section>

            <aside className="glass-panel overflow-hidden rounded">
              {scene.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.cover_url} alt={scene.title} className="cinema-bg h-[420px] w-full object-cover" />
              ) : (
                <div className="poster-fallback h-[420px] w-full" />
              )}
            </aside>
          </div>

          <section className="mt-8 grid gap-3">
            {scene.lines.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.45 }}
                className="glass-panel grid grid-cols-[120px_minmax(0,1fr)] gap-4 rounded p-4 max-[680px]:grid-cols-1">
                <div className="text-[13.5px] font-black text-white">{l.speaker}</div>
                <div>
                  <div className="text-[15px] leading-7 text-white/84">{l.text}</div>
                  {l.emotion && (
                    <span className="mt-3 inline-block rounded bg-[#e50914]/14 px-[10px] py-1 text-[10.5px] font-bold uppercase tracking-wide text-red-100 ring-1 ring-[#e50914]/25">{l.emotion}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
