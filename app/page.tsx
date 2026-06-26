"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton, PricingTable } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  GrayTitle,
  BlueTitle,
  SectionHeading,
  SectionLabel,
} from "@/components/reusable";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { Zap, ArrowRight, Sparkles, MoveRight } from "lucide-react";
import { PLACEHOLDERS, SUGGESTIONS, STEPS, FEATURES } from "@/lib/data";

const StarsBackground = dynamic(
  () =>
    import("@/components/animate-ui/components/backgrounds/stars").then(
      (mod) => mod.StarsBackground
    ),
  { ssr: false }
);

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isHoveringGenerate, setIsHoveringGenerate] = useState(false);

  useEffect(() => {
    if (isFocused || prompt) return;
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isFocused, prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-24 text-center">

        {/* Stars only in dark */}
        <StarsBackground className="absolute inset-0 h-full w-full hidden dark:block pointer-events-none" />

        {/* Ambient orb — dark mode: cyan glow; light mode: soft blue wash */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] h-[600px] w-[600px] rounded-full opacity-20 dark:opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #06b6d4 0%, #3b82f6 50%, transparent 80%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] h-[300px] w-[300px] rounded-full opacity-10 dark:opacity-20 blur-[60px] animate-pulse"
          style={{ background: "#a855f7" }}
        />

        {/* Badge */}
        <Badge
          variant="outline"
          className="z-10 gap-2 px-4 py-2 backdrop-blur border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 mb-8"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Projects coming soon
        </Badge>

        {/* Headline */}
        <h1 className="z-10 max-w-4xl text-balance font-serif text-5xl leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl mb-6">
          <GrayTitle>Forge your dream</GrayTitle>
          <br />
          <BlueTitle>from a single prompt.</BlueTitle>
        </h1>

        <p className="z-10 mx-auto mb-12 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Describe what you want to build. Infera writes the code,
          wires the logic, and ships a working app — instantly.
        </p>

        {/* ── Prompt Box ── */}
        <div className="z-10 w-full max-w-2xl">
          <div
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-lg
              ${isFocused
                ? "border-cyan-500/60 shadow-cyan-500/20 shadow-xl bg-background dark:bg-zinc-900"
                : "border-border bg-background/80 dark:bg-zinc-900/80"
              } backdrop-blur`}
          >
            {/* Glow line at top when focused */}
            <div
              className={`absolute inset-x-0 top-0 h-px transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-0"}`}
              style={{
                background:
                  "linear-gradient(90deg, transparent, #06b6d4, #3b82f6, transparent)",
              }}
            />

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                const el = textareaRef.current;
                if (el) {
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className="w-full resize-none overflow-y-auto bg-transparent px-5 pt-5 pb-3 text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none scrollbar-hide"
              style={{ maxHeight: "240px" }}
            />

            <div className="flex flex-col gap-3 px-4 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground/40 flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono bg-muted/30">↵</kbd>
                to generate
              </p>

              {isSignedIn ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  onMouseEnter={() => setIsHoveringGenerate(true)}
                  onMouseLeave={() => setIsHoveringGenerate(false)}
                  className={`h-10 w-full sm:w-auto rounded-xl px-6 font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200
                    ${prompt.trim()
                      ? "bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                >
                  <Sparkles className={`h-4 w-4 transition-transform duration-200 ${isHoveringGenerate && prompt.trim() ? "rotate-12 scale-110" : ""}`} />
                  Generate
                  <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${isHoveringGenerate && prompt.trim() ? "translate-x-0.5" : ""}`} />
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button className="h-10 w-full sm:w-auto rounded-xl bg-foreground px-6 font-semibold text-background inline-flex items-center justify-center gap-2 hover:bg-foreground/90 hover:shadow-lg active:scale-95 transition-all duration-200">
                    Sign in to Generate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => handleSuggestion(item)}
                className="rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-150 active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="z-10 mt-10 text-xs text-muted-foreground/30">
          No credit card required · 10 free generations on sign up
        </p>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground rounded-full" />
        </div>
      </section>

      {/* ── BROWSER MOCKUP ── */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          {/* Label above */}
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/40 mb-6 font-mono">
            See it in action
          </p>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition-shadow duration-300 hover:shadow-cyan-500/10">

            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <span className="h-3 w-3 rounded-full bg-green-400/60" />
              </div>
              <div className="mx-auto flex h-7 w-64 items-center justify-center rounded-lg bg-muted/40 border border-border/50 gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-muted-foreground/60 font-mono">forge.app/workspace</span>
              </div>
              <div className="w-14" />
            </div>

            {/* Workspace grid */}
            <div className="grid min-h-[440px] grid-cols-1 md:grid-cols-[280px_1fr]">

              {/* Chat panel */}
              <div className="flex flex-col border-b border-border bg-muted/5 md:border-b-0 md:border-r">
                <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Chat</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="flex-1 space-y-4 px-4 py-4">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-2.5">
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        Build a kanban board with drag and drop
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-foreground mt-0.5">
                      <Zap className="h-3 w-3 fill-background text-background" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted/30 border border-border/50 px-3.5 py-2.5">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                         build a Kanban board with Todo, In Progress and Done columns with smooth drag-and-drop.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground mt-0.5">
                      <Zap className="h-3 w-3 fill-background text-background" />
                    </div>
                    <div className="flex gap-1.5 rounded-2xl bg-muted/20 border border-border/50 px-3.5 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border p-3">
                  <div className="flex items-center rounded-xl bg-muted/20 border border-border/50 px-3.5 py-2.5 gap-2">
                    <span className="flex-1 text-xs text-muted-foreground/30">Ask AI to modify...</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                </div>
              </div>

              {/* Preview panel */}
              <div className="flex flex-col bg-card">
                <div className="flex border-b border-border bg-muted/10 px-1">
                  <button className="border-b-2 border-cyan-500 px-5 py-3 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                    Preview
                  </button>
                  <button className="px-5 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Code
                  </button>
                </div>

                <div className="grid flex-1 grid-cols-3 gap-3 p-4">
                  {["Todo", "In Progress", "Done"].map((col, i) => (
                    <div
                      key={col}
                      className="rounded-xl bg-muted/10 border border-border/50 p-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {col}
                        </span>
                        <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50">
                          {3 - i}
                        </span>
                      </div>
                      {Array.from({ length: 3 - i }).map((_, x) => (
                        <div
                          key={x}
                          className="mb-2 rounded-lg border border-border/50 bg-background/60 p-2.5 hover:border-cyan-500/30 transition-colors cursor-grab"
                        >
                          <div
                            className="h-1.5 rounded-full bg-muted-foreground/20 mb-1.5"
                            style={{ width: `${55 + x * 20}%` }}
                          />
                          <div
                            className="h-1 rounded-full bg-muted-foreground/10"
                            style={{ width: `${40 + x * 10}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative px-4 pb-24 sm:pb-32">
        <StarsBackground className="absolute inset-0 h-full w-full hidden dark:block pointer-events-none opacity-50" />

        <div className="mx-auto mb-14 max-w-3xl text-center relative">
          <SectionLabel>Everything you need</SectionLabel>
          <SectionHeading gray="From prompt" blue="to production." />
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground/60 leading-relaxed">
            Build, customize, and ship complete applications with AI — without touching boilerplate.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 relative">
          {FEATURES.map(({ icon: Icon, label, desc }, idx) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 cursor-default"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)",
                }}
              />
              {/* Top edge glow line */}
              <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(90deg, transparent, #06b6d4, transparent)" }}
              />

              <div className="relative">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/30 transition-all duration-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/5">
                  <Icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-cyan-500" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 pb-24 sm:pb-32">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading gray="Idea" blue="to application." />
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground/60 leading-relaxed">
            Three steps. No setup. No boilerplate. Just describe and ship.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          {STEPS.map((step, i) => (
            <div key={step.number} className="group flex gap-6 sm:gap-8">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background shadow-sm transition-all duration-300 group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20 group-hover:shadow-md">
                  <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-cyan-500 transition-colors duration-300">
                    {step.number}
                  </span>
                </div>
                {i !== STEPS.length - 1 && (
                  <div className="mt-2 h-full min-h-16 w-px bg-gradient-to-b from-border to-transparent" />
                )}
              </div>

              <div className="pb-10 pt-1.5">
                <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-200">
                  {step.label}
                </h3>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/60">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-background to-blue-500/5 p-12 text-center shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, #06b6d4 0%, transparent 60%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #3b82f6, transparent)" }}
          />

          <p className="relative text-xs uppercase tracking-widest text-cyan-500 font-mono mb-4">Start building</p>
          <h2 className="relative font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4 leading-tight">
            Your next app is one<br />prompt away.
          </h2>
          <p className="relative text-sm text-muted-foreground/60 mb-8 max-w-sm mx-auto">
            Join developers turning ideas into shipped products in minutes, not weeks.
          </p>

          {isSignedIn ? (
            <Button
              onClick={() => router.push("/workspace")}
              className="h-12 rounded-xl bg-cyan-500 px-8 font-semibold text-black hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start Building Free
              <MoveRight className="h-4 w-4" />
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button className="h-12 rounded-xl bg-cyan-500 px-8 font-semibold text-black hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all duration-200 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Start Building Free
                <MoveRight className="h-4 w-4" />
              </Button>
            </SignInButton>
          )}

          <p className="mt-4 text-xs text-muted-foreground/30">
            10 free generations · No credit card required
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="px-4 pb-32">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Simple pricing</SectionLabel>
          <SectionHeading gray="Start free," blue="scale when ready." />
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground/50">
            No credit card required. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <PricingTable
            checkoutProps={{
              appearance: {
                elements: {
                  drawerRoot: { zIndex: 2000 },
                },
              },
            }}
          />
        </div>
      </section>

    </main>
  );
}