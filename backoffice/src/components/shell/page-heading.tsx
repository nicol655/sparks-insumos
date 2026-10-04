import type { ReactNode } from "react";

export function PageHeading({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-accent-gold font-mono text-[10px] tracking-[0.2em] uppercase">{kicker}</p>
        <h1 className="font-display text-[clamp(32px,3.6vw,46px)] leading-none font-normal">{title}</h1>
      </div>
      {action}
    </div>
  );
}
