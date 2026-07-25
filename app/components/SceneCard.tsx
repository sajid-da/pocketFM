"use client";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Scene } from "@/lib/types";
import { moodGradient } from "@/lib/api";

export function SceneCard({ scene, onPlay, index = 0 }: { scene: Scene; onPlay: () => void; index?: number }) {
  const hasCover = !!scene.cover_url;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(0.25, 0.025 * index), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.08, zIndex: 20 }}
      onClick={onPlay}
      className="story-card-glow group relative h-[178px] w-[318px] shrink-0 overflow-hidden rounded bg-neutral-900 text-left shadow-[0_22px_55px_rgba(0,0,0,.48)] ring-1 ring-white/10 transition"
    >
      <div className="absolute inset-0" style={{ background: moodGradient(scene.mood) }}>
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.cover_url} alt={scene.title} className="cinema-bg h-full w-full object-cover opacity-95 transition duration-700 group-hover:opacity-100" />
        ) : (
          <div className="poster-fallback h-full w-full" />
        )}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.04)_0%,rgba(0,0,0,.2)_42%,rgba(0,0,0,.9)_100%)]" />
      <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[1.4px] text-white/82 backdrop-blur">
        {scene.mood || "scene"}
      </div>
      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:opacity-100">
        <Play size={15} fill="black" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="truncate text-[19px] font-black leading-tight text-white drop-shadow">{scene.title}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-white/66">{scene.ambience || `${scene.lines?.length || 0} lines | audio drama`}</p>
      </div>
    </motion.button>
  );
}
