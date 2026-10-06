"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

const VIDEO_URL = process.env.NEXT_PUBLIC_VIDEO_URL ?? "";
const CHAPTERS = ["Install the app", "Open a pull request", "Review lands", "Re-run with /review"];

/* Click-to-play: the embed only loads on demand. The poster is a real review screenshot so the
   slot looks alive before anyone presses play. */
export function VideoSlot({ id }: { id?: string }) {
  const [on, setOn] = useState(false);
  const src = VIDEO_URL ? `${VIDEO_URL}${VIDEO_URL.includes("?") ? "&" : "?"}autoplay=1` : "";
  return (
    <figure id={id}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-brand/40 bg-card shadow-2xl shadow-brand/25 ring-1 ring-white/10">
        {on && src ? (
          <iframe
            src={src}
            title="CodeReview AI walkthrough: install, open a PR, review lands"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        ) : (
          <button
            onClick={() => setOn(true)}
            aria-label="Play the 3-minute walkthrough video"
            className="group absolute inset-0 grid place-items-center"
          >
            <Image
              src="/screenshots/review.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover object-top opacity-40 blur-[2px] transition-opacity group-hover:opacity-55"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-black">
              Full working demo · 3 min
            </span>
            <span className="relative grid size-24 place-items-center rounded-full bg-white text-black shadow-xl shadow-black/50 transition-transform duration-200 group-hover:scale-110">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
              <Play fill="currentColor" size={32} className="relative ml-1" />
            </span>
            <span className="absolute bottom-5 text-sm font-medium text-white">
              {on && !src ? "Video coming soon." : "Watch how it works, from install to review"}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
        {CHAPTERS.map((c, i) => (
          <span key={c} className="rounded-full border border-line bg-card px-3 py-1">
            {i + 1}. {c}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
