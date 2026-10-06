/* Layout wrappers only. The site is deliberately static: no scroll-triggered motion. */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  /* Kept so existing call sites don't change; no longer used. */
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode[];
  className?: string;
  gap?: number;
}) {
  return (
    <div className={className}>
      {children.map((c, i) => (
        <div key={i} className="h-full">
          {c}
        </div>
      ))}
    </div>
  );
}
