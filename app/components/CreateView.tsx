"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, ImageIcon, Mic2, Radio, Sparkles } from "lucide-react";
import type { Scene } from "@/lib/types";
import { generateScene } from "@/lib/api";

const SEEDS = [
  "A lighthouse keeper hears knocking from inside the sealed cellar during a storm. Genre: horror.",
  "A cursed princess opens a moonlit portal under a burning kingdom. Genre: fantasy.",
  "Two estranged sisters meet at their mother's grave in the rain and finally speak. Genre: drama.",
  "A thief realizes mid-heist that the vault was a trap. Genre: thriller.",
  "A detective receives a radio call from himself, ten years in the future. Genre: mystery.",
];

const STAGES = [
  "Directing a 60-second scene",
  "Writing emotional voice directions",
  "Designing character portraits",
  "Performing each line with feeling",
  "Generating ElevenLabs ambience",
  "Mixing voices, effects, and atmosphere",
];

export function CreateView({ onGenerated }: { onGenerated: (s: Scene) => void }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  async function run() {
    if (!prompt.trim()) {
      setError("Write a premise first - a moment, its characters, and a genre.");
      return;
    }
    setError("");
    setBusy(true);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2400);
    try {
      const scene = await generateScene(prompt.trim());
      clearInterval(timer);
      onGenerated(scene);
    } catch (e) {
      clearInterval(timer);
      setBusy(false);
      setError(e instanceof Error ? e.message : "Generation failed.");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="-mx-11 -mt-[26px] min-h-screen overflow-hidden max-[860px]:-mx-[18px]">
      <div className="relative px-11 py-11 max-[860px]:px-[18px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-texture absolute inset-0 opacity-55" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.78)_46%,rgba(5,5,5,.96)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1220px] grid-cols-[minmax(0,1.25fr)_380px] gap-7 max-[980px]:grid-cols-1">
          <section>
            <div className="mb-8 flex items-end justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded bg-[#e50914] px-3 py-1 text-[11px] font-black uppercase tracking-[2px] text-white shadow-[0_12px_34px_rgba(229,9,20,.28)]">
                  <Clapperboard size={14} /> Director Console
                </div>
                <h1 className="text-[clamp(44px,6vw,76px)] font-black leading-[.9] text-white">Create a Story</h1>
              </div>
              <p className="max-w-[360px] text-[14px] leading-6 text-white/62">
                Build a short scene with voice performance, sound bed, cover art, character frames, and a finished mix.
              </p>
            </div>

            <div className="glass-panel rounded p-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A detective corners the suspect in a rain-soaked alley at midnight. The suspect is terrified and begging. Genre: noir thriller."
                className="min-h-[230px] w-full resize-y rounded bg-black/42 p-6 text-[16px] leading-7 text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-[#e50914]"
                disabled={busy}
              />

              <div className="mt-4 flex flex-wrap gap-[9px]">
                {SEEDS.map((seed, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(seed)}
                    className="cursor-pointer rounded bg-white/8 px-4 py-2 text-[12px] font-bold text-white/62 ring-1 ring-white/10 transition hover:bg-white/14 hover:text-white"
                  >
                    {seed.split(".")[0]}.
                  </button>
                ))}
              </div>

              <button
                onClick={run}
                disabled={busy}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-[#e50914] py-[17px] text-base font-black text-white shadow-[0_18px_55px_rgba(229,9,20,.34)] transition hover:bg-[#f6121d] disabled:opacity-60"
              >
                <Sparkles size={18} /> {busy ? "Generating..." : "Generate Story"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}
          </section>

          <aside className="glass-panel rounded p-6">
            <div className="mb-5 text-[12px] font-black uppercase tracking-[2px] text-white/42">Production Board</div>
            <div className="space-y-4">
              {[
                [Mic2, "Voice cast", "Role-aware narration and character delivery"],
                [Radio, "Atmosphere", "Loopable ambience shaped around the scene"],
                [ImageIcon, "Visual storyboard", "Cover art plus character images beside the dialogue"],
              ].map(([Icon, title, body]) => (
                <div key={String(title)} className="rounded bg-white/7 p-4 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center gap-3 text-sm font-black text-white">
                    <Icon size={18} className="text-[#e50914]" /> {title as string}
                  </div>
                <p className="text-[12.5px] leading-5 text-white/52">{body as string}</p>
                </div>
              ))}
            </div>

            {busy && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <div className="mb-3 text-[12px] font-black uppercase tracking-[2px] text-white/42">Now Rendering 60s Scene</div>
                <div className="flex flex-col gap-[12px]">
                  {STAGES.map((label, i) => {
                    const done = i < stage;
                    const active = i === stage;
                    return (
                      <div key={i} className="flex items-center gap-[12px] transition-opacity duration-300" style={{ opacity: done ? 0.75 : active ? 1 : 0.35 }}>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ border: `2px solid ${done || active ? "#e50914" : "rgba(255,255,255,.12)"}`, background: done ? "#e50914" : "transparent" }}
                        >
                          {done ? "✓" : active ? <span className="spin h-[9px] w-[9px] rounded-full" style={{ borderTop: "2px solid #fff", borderRight: "2px solid transparent" }} /> : ""}
                        </span>
                        <span className="text-[13.5px] font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </motion.div>
  );
}

