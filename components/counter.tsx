/* A plain number. (It used to count up on scroll; recruiters just need the figure.) */
export function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  return (
    <span>
      {prefix}
      {to}
      {suffix}
    </span>
  );
}
