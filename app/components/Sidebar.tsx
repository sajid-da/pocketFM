"use client";
import { motion } from "framer-motion";
import { Compass, Home, LayoutDashboard, Library, PenLine, Play } from "lucide-react";

export type View = "home" | "discover" | "library" | "create" | "studio" | "player";

const ITEMS: { v: View; label: string; Icon: typeof Home }[] = [
  { v: "home", label: "Browse", Icon: Home },
  { v: "discover", label: "Genres", Icon: Compass },
  { v: "library", label: "My List", Icon: Library },
  { v: "create", label: "Create Story", Icon: PenLine },
  { v: "studio", label: "Developer", Icon: LayoutDashboard },
];

export function Sidebar({ view, setView, hasPlaying }: { view: View; setView: (v: View) => void; hasPlaying: boolean }) {
  const items = hasPlaying ? [...ITEMS, { v: "player" as View, label: "Now Playing", Icon: Play }] : ITEMS;
  return (
    <aside className="sticky top-0 z-30 flex h-screen w-[250px] shrink-0 flex-col border-r border-white/8 bg-black/82 px-5 py-7 backdrop-blur-xl max-[860px]:hidden">
      <button onClick={() => setView("home")} className="mb-9 flex items-center gap-3 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded bg-[#e50914] text-[20px] font-black text-white">E</span>
        <span className="text-[22px] font-black tracking-tight text-white">EchoVerse</span>
      </button>
      <nav className="flex flex-col gap-1">
        {items.map(({ v, label, Icon }) => {
          const on = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className="relative flex w-full items-center gap-3 rounded px-3 py-3 text-left text-[14px] font-bold transition"
              style={{ color: on ? "#fff" : "rgba(255,255,255,.56)" }}
            >
              {on && (
                <motion.span
                  layoutId="navpill"
                  className="absolute inset-0 -z-[1] rounded bg-white/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={19} color={on ? "#e50914" : "currentColor"} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-5 text-[12px] leading-5 text-white/42">
        <b className="font-bold text-white/68">Creator workspace</b>
        <br />
        Generate, review, and replay your AI audio stories.
      </div>
    </aside>
  );
}
