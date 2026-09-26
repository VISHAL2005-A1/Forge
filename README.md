<div align="center">

# Forge

**AI-powered website builder. Describe what you want — get production-ready code instantly.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk)](https://clerk.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Components-000000?style=flat-square)](https://ui.shadcn.com/)


[Live Demo](https://forge-ten-kappa.vercel.app/) 

</div>

---

## The Problem

Building websites still has a high entry barrier. Developers spend hours setting up boilerplate, tweaking layouts, and wiring components — before writing a single line of business logic. Non-developers can't do it at all without hiring someone.

Existing AI website builders either:
- **Lock you into one AI provider** — if it's down or slow, you wait
- **Show no live preview** — you generate blind and iterate slowly
- **Don't save your work** — every session starts from scratch

**Forge solves all three.**

---

## What Forge Does

Forge is a full-stack AI website builder that takes a plain-English description and generates a complete, styled, working website — rendered live in your browser the moment generation completes.

Under the hood, it runs a **multi-provider AI fallback chain** across OpenRouter, Gemini Flash 2.5, Mistral, and HuggingFace. If one provider is slow or quota-limited, Forge silently switches to the next — so you're never stuck on a loading spinner because of someone else's rate limit.

Every project is saved to your account. Come back tomorrow, it's still there.

---

## ✨ Features

**For users**
- **Prompt-to-website** — describe your site in plain English, get a full working codebase
- **Live in-browser preview** — see the generated site render in real time using Sandpack, no deployments needed
- **Project dashboard** — all your generated sites saved and accessible from one place
- **One-click authentication** — sign in with Google, GitHub, or email via Clerk

**Under the hood**
- **Multi-provider AI fallback** — OpenRouter → Gemini Flash 2.5 → Mistral → HuggingFace, with automatic failover on quota errors or timeouts
- **Persistent provider state** — uses a `globalThis` singleton so the fallback router doesn't reset between requests in the same session
- **Post-processing pipeline** — cleans and sanitizes raw LLM output (CSS injection, package normalization, import fixing) before rendering
- **Upsert-based user sync** — Clerk webhook auto-creates a Supabase user record on first sign-in, no duplicate entries
- **Type-safe throughout** — full TypeScript across the stack with Prisma-generated types

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) | Full-stack React framework |
| Auth | [Clerk](https://clerk.com/) | Authentication & user management |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) | Persistent storage |
| ORM | [Prisma](https://www.prisma.io/) | Type-safe database access |
| UI | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS | Component library & styling |
| Code Preview | [Sandpack](https://sandpack.codesandbox.io/) | In-browser live preview |
| AI Providers | OpenRouter, Gemini Flash 2.5, Mistral, HuggingFace | Website generation |
| Language | TypeScript | End-to-end type safety |

---

## 🤖 How the AI Fallback System Works

Single-provider AI apps break the moment that provider hits a rate limit. Forge avoids this with a **sequential fallback chain**:

```
Request comes in
      ↓
  OpenRouter ──── fails? ──→ Gemini Flash 2.5 ──── fails? ──→ Mistral ──── fails? ──→ HuggingFace
      ↓ (success)                  ↓ (success)                   ↓ (success)               ↓
  Return result              Return result               Return result            Return result
```

- **No user action required** — failover is invisible
- **Quota-aware** — tracks which providers are exhausted during a session using a `globalThis` singleton (survives across API calls in the same Node.js process)
- **Output sanitization** — each provider's raw output goes through a post-processor that fixes malformed JSON, injects missing CSS, normalizes package names, and resolves broken imports before Sandpack renders it

---

## 📁 Project Structure

```
forge/
├── actions/              # Next.js server actions (generation, project CRUD)
├── app/
│   ├── (auth)/           # Clerk sign-in / sign-up pages
│   ├── api/              # API routes (webhooks, AI pipeline)
│   ├── dashboard/        # User project dashboard
│   └── ...               # Other app routes
├── components/           # Shared React components
│   └── ui/               # shadcn/ui base components
├── lib/                  # Core utilities
│   ├── ai/               # Multi-provider fallback router + post-processors
│   └── prisma.ts         # Prisma client singleton
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── types/                # Shared TypeScript types
├── proxy.ts              # Request proxy config
├── next.config.ts
├── prisma.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- A [Clerk](https://clerk.com/) application
- At least one AI provider API key (all four recommended)

### 1. Clone the repo

```bash
git clone https://github.com/VISHAL2005-A1/forge.git
cd forge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
# ── Clerk ──────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ── Supabase / Prisma ──────────────────────────────────
DATABASE_URL=postgresql://...

# ── AI Providers ───────────────────────────────────────
# Add all four for best reliability; the fallback system uses whichever are available
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=AIza...
MISTRAL_API_KEY=...
HUGGINGFACE_API_KEY=hf_...
```

> **Tip:** The more provider keys you configure, the more resilient generation becomes. With all four set, Forge can handle quota limits from any single provider without any interruption.

### 4. Initialize the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ⚠️ Known Issues & Active Work

This project is under active development. Current known issues:

| Issue | Status |
|---|---|
| Generation occasionally fails mid-stream on certain prompts | 🔧 In progress — JSON parsing edge cases from LLM responses |
| Complex multi-page prompts may produce incomplete output | 🔧 In progress |
| First generation may be slow if multiple providers are under load | 📋 Planned — streaming output to show partial results |

If you hit a generation failure, re-submitting your prompt usually works — the fallback system will try the next provider in the chain.

---

## 🗺️ Roadmap

- [ ] Streaming token output (show partial generation in real time)
- [ ] Resolve JSON parsing edge cases for all providers
- [ ] Export generated site as downloadable ZIP

---


<div align="center">

Built by [Vishal Gautam](https://linkedin.com/in/vishal-gautam-a0574429a) &nbsp;·&nbsp; [GitHub](https://github.com/VISHAL2005-A1)

</div>
