import Image from "next/image";

import { cn } from "../lib/utils";
export function ScreenshotFrame({
  src,
  alt,
  caption,
  w,
  h,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  w: number;
  h: number;
  className?: string;
}) {
  return (
    <figure className={cn("group", className)}>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xl shadow-black/40 transition-transform duration-500 group-hover:-translate-y-1">
        <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-2.5">
          <i className="size-2.5 rounded-full bg-bad/70" />
          <i className="size-2.5 rounded-full bg-amber-400/80" />
          <i className="size-2.5 rounded-full bg-good/70" />
          <span className="ml-3 truncate font-mono text-xs text-muted">
            github.com / pull request
          </span>
        </div>
        <Image
          src={src}
          alt={alt}
          width={w}
          height={h}
          className="h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
