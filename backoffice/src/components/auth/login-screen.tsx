import { copy } from "@/copy/es";
import { LoginForm, type LoginHandler } from "@/components/auth/login-form";

export function LoginScreen({ login }: { login?: LoginHandler } = {}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="bg-ink text-canvas flex flex-col justify-between gap-16 px-5 py-12 sm:px-16 lg:py-16">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-accent-gold uppercase">
            {copy.brandKicker}
          </p>
          <p className="font-display mt-16 text-6xl leading-none tracking-tight">{copy.wordmark}</p>
          <p className="mt-3 text-sm tracking-[0.28em] text-accent-gold uppercase">
            {copy.wordmarkSub}
          </p>
        </div>
        <div>
          <ul className="border-border-on-ink border-t">
            {copy.lines.map((line) => (
              <li
                key={line.index}
                className="border-border-on-ink flex items-baseline justify-between gap-6 border-b py-4"
              >
                <span className="font-mono text-[10px] tracking-[0.18em] text-accent-gold uppercase">
                  {line.index} {line.title}
                </span>
                <span className="text-canvas/70 text-right text-sm">{line.detail}</span>
              </li>
            ))}
          </ul>
          <p className="text-canvas/70 mt-8 font-mono text-[10px] tracking-[0.18em] uppercase">
            {copy.brandFoot}
          </p>
        </div>
      </section>
      <section className="bg-canvas grid place-items-center px-5 py-16">
        <div className="w-full max-w-[420px]">
          <p className="font-mono text-[10px] tracking-[0.22em] text-accent-gold uppercase">
            {copy.accessKicker}
          </p>
          <h1 className="font-display mt-4 text-5xl text-ink">{copy.loginTitle}</h1>
          <LoginForm login={login} />
        </div>
      </section>
    </main>
  );
}
