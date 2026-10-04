import { copy } from "@/copy/es";

export default function UnauthorizedPage() {
  return (
    <main className="bg-canvas grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-[420px]">
        <p className="font-mono text-[10px] tracking-[0.22em] text-accent-gold uppercase">
          {copy.unauthorizedKicker}
        </p>
        <h1 className="font-display mt-4 text-5xl text-ink">{copy.unauthorizedTitle}</h1>
        <p className="mt-4 text-sm text-text-muted">{copy.unauthorizedMessage}</p>
        <a href="/login" className="mt-8 inline-flex min-h-11 items-center underline">
          {copy.backToLogin}
        </a>
      </div>
    </main>
  );
}
