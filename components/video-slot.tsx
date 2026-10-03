"use client";
import { useState } from "react";
import { Play } from "lucide-react";

/* No autoplay: poster + play button. Paste a YouTube/Vimeo embed URL into VIDEO_URL once recorded. */
const VIDEO_URL = "";

export function VideoSlot() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-line bg-card shadow-2xl shadow-brand/10">
        {on && VIDEO_URL ? (
          <iframe
            src={`${VIDEO_URL}?autoplay=1`}
            title="Install and first review"
            allow="autoplay; fullscreen"
            className="size-full"
          />
        ) : (
          <button
            onClick={() => setOn(true)}
            aria-label="Play video"
            className="group grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#4f46e5aa,transparent_60%)]"
          >
            <span className="grid size-20 place-items-center rounded-full bg-white text-black transition-transform group-hover:scale-110">
              <Play fill="currentColor" size={26} className="ml-1" />
            </span>
            {on && !VIDEO_URL && (
              <span className="absolute bottom-6 text-sm text-white/70">
                Video coming soon.
              </span>
            )}
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Install the app, open a PR, and watch the review land.
      </p>
    </div>
  );
}
