"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Play, Plus, Sparkles } from "lucide-react";
import type { Scene } from "@/lib/types";
import { moodGradient } from "@/lib/api";
import { SceneCard } from "./SceneCard";

const GENRES = ["Horror", "Fantasy", "Thriller", "Drama", "Romance", "Mystery", "Adventure"];
const SAMPLE_COVERS = [
  "/media/cover_de055cbe-bd05-4291-b22d-5c96585560ee.png",
  "/media/cover_b9fd10b9-3322-4e7a-8460-07ee1891f85b.png",
  "/media/cover_ecc67b34-7345-4a0b-8fcf-d5ee53bd5c88.png",
];

const fallbackScenes: Scene[] = GENRES.map((genre, i) => ({
  id: `sample-${genre.toLowerCase()}`,
  title: [
    "The Cellar Knock",
    "Moon Gate Kingdom",
    "Vault Zero",
    "Rain at the Grave",
    "Last Train Home",
    "The Missing Broadcast",
    "Skyship at Dawn",
  ][i],
  mood: genre.toLowerCase(),
  ambience: [
    "Storm winds, old wood, distant thunder, a locked room breathing in the dark.",
    "Crystal forests, wingbeats above the clouds, a portal humming with ancient light.",
    "Metal doors, ticking sensors, a silent alarm waking beneath the floor.",
    "Rain on stone, trembling voices, flowers crushed beside a family secret.",
    "A soft platform announcement, midnight rails, two hearts running out of time.",
    "Tape hiss, empty streets, a signal repeating one name again and again.",
    "Canvas sails snapping in high wind, engines glowing over a sunrise sea.",
  ][i],
  cover_url: SAMPLE_COVERS[i % SAMPLE_COVERS.length],
  lines: [{ speaker: "Narrator", role: "narrator", text: `${genre} scene preview`, emotion: "cinematic" }],
  audio_url: "",
  created_at: 1_700_000_000_000 - i,
}));

export function HomeView({ scenes, onCreate, onPlay }: { scenes: Scene[]; onCreate: () => void; onPlay: (s: Scene) => void }) {
  const catalog = scenes.length ? scenes : fallbackScenes;
  const featured = catalog.slice(0, Math.min(6, catalog.length));
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 5200);
    return () => clearInterval(t);
  }, [featured.length]);

  const hero = featured[heroIdx];

  const rails = useMemo(() => {
    const created = scenes;
    const grouped = catalog.reduce<Record<string, Scene[]>>((acc, scene) => {
      const key = normalizeGenre(scene.mood);
      (acc[key] ||= []).push(scene);
      return acc;
    }, {});

    const genreRails = GENRES.map((genre) => {
      const key = genre.toLowerCase();
      const base = grouped[key]?.length ? grouped[key] : fallbackScenes.filter((s) => normalizeGenre(s.mood) === key);
      return { title: genre, scenes: expandRail(base, 10), tone: key };
    });

    return [
      { title: "Continue Watching", scenes: created.slice(0, 8), tone: "continue" },
      { title: "Your New Releases", scenes: created, tone: "release" },
      ...genreRails,
    ].filter((rail) => rail.scenes.length);
  }, [catalog, scenes]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="-mx-11 -mt-[26px] max-[860px]:-mx-[18px]">
      <section className="isolate relative min-h-[620px] overflow-hidden px-11 pb-16 pt-10 max-[860px]:px-[18px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{ background: moodGradient(hero.mood) }}
          >
            {hero.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.cover_url} alt="" className="cinema-bg h-full w-full object-cover" />
            ) : (
              <div className="hero-texture h-full w-full" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.88)_25%,rgba(5,5,5,.34)_58%,rgba(5,5,5,.72)_100%)]" />
        <div className="film-grain pointer-events-none absolute inset-0 z-[2]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-52 bg-[linear-gradient(180deg,transparent,#050505)]" />

        <div className="relative z-20 flex min-h-[540px] max-w-[820px] flex-col justify-end">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded bg-[#e50914] px-3 py-1 text-[12px] font-black uppercase tracking-[2px] text-white shadow-[0_12px_36px_rgba(229,9,20,.34)]">
            <Flame size={14} fill="white" /> EchoVerse Original
          </div>
          <h1 className="max-w-[720px] text-[clamp(42px,7vw,88px)] font-black leading-[.9] text-white">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-[650px] text-[17px] leading-8 text-white/78">
            {hero.ambience || "Generate cinematic audio dramas with voice, mood, atmosphere, and cover art."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded bg-white/12 px-3 py-1 text-[12px] font-bold uppercase tracking-[1.5px] text-white/76 ring-1 ring-white/10">{hero.mood || "scene"}</span>
            <span className="rounded bg-white/12 px-3 py-1 text-[12px] font-bold uppercase tracking-[1.5px] text-white/76 ring-1 ring-white/10">{hero.lines.length} lines</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => (hero.audio_url ? onPlay(hero) : onCreate())}
              className="inline-flex items-center gap-2 rounded bg-white px-7 py-3 text-[15px] font-extrabold text-black shadow-[0_18px_45px_rgba(255,255,255,.16)] transition hover:bg-white/85"
            >
              <Play size={19} fill="black" /> {hero.audio_url ? "Play" : "Create"}
            </button>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded bg-white/16 px-7 py-3 text-[15px] font-bold text-white ring-1 ring-white/15 transition hover:bg-white/24"
            >
              <Plus size={19} /> New Story
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 space-y-9 px-11 pb-16 max-[860px]:px-[18px]">
        {rails.map((rail, i) => (
          <MovingRail key={rail.title} title={rail.title} scenes={rail.scenes} onPlay={onPlay} reverse={i % 2 === 1} />
        ))}
      </section>
    </motion.div>
  );
}

function MovingRail({ title, scenes, onPlay, reverse }: { title: string; scenes: Scene[]; onPlay: (s: Scene) => void; reverse?: boolean }) {
  return (
    <div className="group/rail">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[22px] font-black text-white">{title}</h2>
        <span className="text-[12px] font-semibold uppercase tracking-[1.8px] text-white/38">{scenes.length} titles</span>
      </div>
      <div className="rail-fade overflow-hidden py-3">
        <motion.div
          className="flex w-max gap-3"
          animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        >
          {[...scenes, ...scenes].map((scene, i) => (
            <SceneCard key={`${title}-${scene.id}-${i}`} scene={scene} index={i % scenes.length} onPlay={() => (scene.audio_url ? onPlay(scene) : undefined)} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function normalizeGenre(mood?: string) {
  const value = (mood || "drama").toLowerCase();
  if (value.includes("horror") || value.includes("eerie") || value.includes("dark")) return "horror";
  if (value.includes("fantasy") || value.includes("magic")) return "fantasy";
  if (value.includes("thriller") || value.includes("tense")) return "thriller";
  if (value.includes("romance") || value.includes("tender")) return "romance";
  if (value.includes("mystery") || value.includes("noir")) return "mystery";
  if (value.includes("adventure")) return "adventure";
  return "drama";
}

function expandRail(items: Scene[], min: number) {
  if (!items.length) return [];
  const expanded: Scene[] = [];
  while (expanded.length < min) expanded.push(...items);
  return expanded.slice(0, min);
}
