"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import type { Scene } from "@/lib/types";
import { loadScenes } from "@/lib/api";
import { Sidebar, type View } from "./Sidebar";
import { HomeView } from "./HomeView";
import { CreateView } from "./CreateView";
import { PlayerView } from "./PlayerView";
import { SceneCard } from "./SceneCard";

export function AppShell() {
  const [view, setView] = useState<View>("home");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [current, setCurrent] = useState<Scene | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadScenes().then((loaded) => {
      if (loaded.length) setScenes(loaded);
    });
  }, []);

  function play(scene: Scene) {
    setCurrent(scene);
    setView("player");
  }

  function onGenerated(scene: Scene) {
    setScenes((prev) => [scene, ...prev]);
    play(scene);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return scenes;
    return scenes.filter((scene) =>
      scene.title.toLowerCase().includes(q) ||
      scene.mood.toLowerCase().includes(q) ||
      scene.lines.some((line) => line.speaker.toLowerCase().includes(q) || line.text.toLowerCase().includes(q))
    );
  }, [scenes, query]);

  return (
    <div className="relative z-[1] flex min-h-screen">
      <Sidebar view={view} setView={setView} hasPlaying={!!current} />
      <main className="relative min-w-0 flex-1 px-11 pb-[130px] pt-[26px] max-[860px]:px-[18px]">
        <AnimatePresence mode="wait">
          {view === "home" && <HomeView key="home" scenes={scenes} onCreate={() => setView("create")} onPlay={play} />}
          {view === "create" && <CreateView key="create" onGenerated={onGenerated} />}
          {view === "player" && current && <PlayerView key="player" scene={current} onBack={() => setView("home")} />}

          {view === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen px-11 py-10 max-[860px]:-mx-[18px] max-[860px]:px-[18px]">
              <div className="pointer-events-none absolute inset-0 -z-[1]">
                <div className="hero-texture h-[340px] opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.38),#050505_45%)]" />
              </div>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="mb-3 text-xs font-black uppercase tracking-[2.5px] text-[#e50914]">Genres</div>
                  <h1 className="text-[clamp(40px,5vw,68px)] font-black leading-[.9] text-white">Explore every scene</h1>
                </div>
                <div className="relative w-full max-w-[560px]">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/42" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, mood, character, or line..."
                    className="glass-panel w-full rounded py-[15px] pl-12 pr-4 text-[15px] text-white outline-none focus:ring-2 focus:ring-[#e50914]/70"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-[18px]">
                {filtered.length ? (
                  filtered.map((scene, i) => <SceneCard key={scene.id} scene={scene} index={i} onPlay={() => play(scene)} />)
                ) : (
                  <div className="glass-panel w-full rounded p-9 text-center text-sm text-white/58">No scenes match "{query}".</div>
                )}
              </div>
            </motion.div>
          )}

          {view === "library" && (
            <motion.div key="library" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen px-11 py-10 max-[860px]:-mx-[18px] max-[860px]:px-[18px]">
              <div className="pointer-events-none absolute inset-0 -z-[1] bg-[radial-gradient(700px_320px_at_80%_0%,rgba(229,9,20,.22),transparent_65%)]" />
              <div className="glass-panel mb-8 flex items-center justify-between rounded p-7 max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-3">
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-[2.5px] text-[#e50914]">Saved Stories</div>
                  <h1 className="text-[clamp(40px,5vw,62px)] font-black leading-none text-white">My List</h1>
                </div>
                <span className="rounded bg-white/10 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[1.8px] text-white/62 ring-1 ring-white/10">{scenes.length} scenes</span>
              </div>
              <div className="flex flex-wrap gap-[18px]">
                {scenes.length ? (
                  scenes.map((scene, i) => <SceneCard key={scene.id} scene={scene} index={i} onPlay={() => play(scene)} />)
                ) : (
                  <div className="glass-panel w-full rounded p-10 text-center">
                    <h2 className="mb-2 text-2xl font-black text-white">Your library is waiting</h2>
                    <p className="text-sm text-white/56">Stories you generate collect here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "studio" && (
            <motion.div key="studio" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen px-11 py-10 max-[860px]:-mx-[18px] max-[860px]:px-[18px]">
              <div className="pointer-events-none absolute inset-0 -z-[1]">
                <div className="hero-texture h-[360px] opacity-35" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.24),#050505_48%)]" />
              </div>
              <div className="mb-8 max-w-[820px]">
                <div className="mb-3 text-xs font-black uppercase tracking-[2.5px] text-[#e50914]">Developer Option</div>
                <h1 className="mb-3 text-[clamp(42px,5vw,68px)] font-black leading-none text-white">Developer Studio</h1>
                <p className="text-[15px] leading-7 text-white/60">Create stories, inspect generated scenes, and jump back into any audio drama you made.</p>
              </div>
              <div className="mb-9 grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
                {[["Stories", scenes.length], ["Total lines", scenes.reduce((a, s) => a + s.lines.length, 0)], ["With covers", scenes.filter((s) => s.cover_url).length]].map(([label, val]) => (
                  <div key={label} className="glass-panel rounded p-6">
                    <div className="text-[13px] text-white/48">{label}</div>
                    <div className="mt-1 text-[34px] font-black text-white">{val}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setView("create")}
                className="mb-8 inline-flex cursor-pointer items-center gap-2 rounded bg-[#e50914] px-6 py-[13px] text-[15px] font-black text-white shadow-[0_10px_34px_rgba(229,9,20,.35)] transition hover:bg-[#f6121d]"
              >
                <Sparkles size={17} /> New Story
              </button>
              <div className="flex flex-wrap gap-[18px]">
                {scenes.map((scene, i) => <SceneCard key={scene.id} scene={scene} index={i} onPlay={() => play(scene)} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {view !== "create" && view !== "player" && (
        <button
          suppressHydrationWarning
          onClick={() => setView("create")}
          className="fixed bottom-9 right-9 z-50 flex cursor-pointer items-center gap-[10px] rounded bg-[#e50914] px-[26px] py-4 text-[15px] font-black text-white shadow-[0_12px_44px_rgba(229,9,20,.48)] max-[860px]:bottom-[18px] max-[860px]:right-[18px]"
        >
          Create
        </button>
      )}
    </div>
  );
}
