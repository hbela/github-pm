---
name: claude-developer-platform
description: Build AI features using the Anthropic Claude API in this Next.js GitHub PM project. Use when implementing sprint planner, issue summarizer, or voice-to-issue extraction.
argument-hint: [feature]
---

You are building an AI feature for the **GitHub PM** project using the Anthropic Claude API.

## Project Context

This is a Next.js 15 App Router project. All AI calls go through **Next.js API routes** (server-side only — the Anthropic API key must never reach the browser).

**Planned AI features:**
1. **Sprint Planner** — Analyze open GitHub issues and generate an optimal sprint plan
2. **Issue Summarizer** — Read issue comments and extract key decisions / blockers
3. **Voice-to-Issue** — Convert transcribed speech into a structured GitHub issue (title, body, labels, assignee)

## Environment Variable

Add to `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
```

## Default Models

| Use case | Model |
|----------|-------|
| Sprint planner, issue summarizer (complex reasoning) | `claude-sonnet-4-6` |
| Voice-to-issue extraction (fast, structured output) | `claude-haiku-4-5-20251001` |

## SDK Setup

```bash
pnpm add @anthropic-ai/sdk
```

## Standard API Route Pattern (Next.js App Router)

```ts
// src/app/api/ai/[feature]/route.ts
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  // ... validate input

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: "..." }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return NextResponse.json({ result: text })
}
```

## Structured Output Pattern

For features that need typed output (sprint plan, issue creation), use JSON mode:

```ts
const message = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Extract a GitHub issue from this voice note.
    Return JSON matching this schema:
    { "title": string, "body": string, "labels": string[], "assignee": string | null }

    Voice note: ${transcript}`
  }],
})

const parsed = JSON.parse(text) as { title: string; body: string; labels: string[]; assignee: string | null }
```

## Feature-Specific API Routes

| Feature | Route | Input | Output |
|---------|-------|-------|--------|
| Sprint planner | `POST /api/ai/sprint-plan` | `{ issues: GHIssue[], sprintDays: number }` | Sprint plan object |
| Issue summarizer | `POST /api/ai/summarize-issue` | `{ issue: GHIssue, comments: GHComment[] }` | Summary string |
| Voice-to-issue | `POST /api/ai/voice-to-issue` | `{ transcript: string, repoLabels: string[] }` | Issue draft object |

## Key Files to Reference

- `src/lib/github/types.ts` — `GHIssue`, `GHComment` types to pass as context
- `src/auth.ts` — always call `auth()` to protect AI routes
- `src/app/api/github/` — existing API route patterns to follow

## Task

$ARGUMENTS
