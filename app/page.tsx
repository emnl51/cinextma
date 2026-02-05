import { Button } from "@heroui/react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-start gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-foreground/60">
          Turbopack Ready
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Build cinematic experiences with Next.js + HeroUI
        </h1>
        <p className="max-w-2xl text-base text-foreground/70 sm:text-lg">
          This project ships with Tailwind CSS v4, HeroUI v2, and a PWA setup
          that stays disabled in development to keep Turbopack fast and stable.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button color="primary" size="lg">
          Get started
        </Button>
        <Button variant="bordered" size="lg">
          View documentation
        </Button>
      </div>
    </main>
  );
}
