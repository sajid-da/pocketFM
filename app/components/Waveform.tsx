"use client";
import { useMemo } from "react";

export function Waveform({
  count = 40,
  playing = true,
  className = "",
  barClass = "",
}: {
  count?: number;
  playing?: boolean;
  className?: string;
  barClass?: string;
}) {
  // stable random heights per mount
  const heights = useMemo(
    () => Array.from({ length: count }, (_, i) => 14 + ((i * 37 + count * 11) % 72)),
    [count]
  );
  return (
    <div className={`flex items-center gap-[3px] ${className}`}>
      {heights.map((h, i) => (
        <i
          key={i}
          className={`wavebar ${playing ? "playing" : ""} ${barClass}`}
          style={{
            flex: 1,
            height: `${h}%`,
            borderRadius: 4,
            background: "linear-gradient(180deg, var(--accent-3), var(--accent))",
            animationDelay: `${(i * 0.03).toFixed(2)}s`,
            animationDuration: `${(1.1 + (i % 5) * 0.15).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
