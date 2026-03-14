# Phase 3 — AI Features

## Overview

Phase 3 adds AI superpowers to the GitHub PM UI, powered by the **Claude API (Anthropic)**. All AI calls are server-side only — the `ANTHROPIC_API_KEY` never reaches the browser.

### Feature Roadmap

| Step | Feature | Status |
|------|---------|--------|
| 3.1 | AI Issue Summarizer | **Next to implement** |
| 3.2 | Voice-to-Issue Creation | Planned |
| 3.3 | Sprint Planner | Planned |

### New Environment Variable

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Add to `.env.local` (never commit).

---

## Step 3.1 — AI Issue Summarizer

### User Flow

On any issue detail page (`/repos/[owner]/[repo]/issues/[number]`):

1. User clicks **"Summarize with AI"** button below the issue body
2. Button shows loading state (spinner)
3. Collapsible panel appears with:
   - **Summary** — 1-2 sentence overview
   - **Key Decisions** — bullet list extracted from the discussion
   - **Action Items** — bullet list of concrete next steps

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ai/client.ts` | Anthropic SDK singleton — reads `ANTHROPIC_API_KEY` |
| `src/lib/ai/types.ts` | `IssueSummary` type + future AI response types |
| `src/lib/ai/prompts.ts` | `buildSummaryPrompt()` + future prompt builders |
| `src/app/api/ai/summarize-issue/route.ts` | `POST /api/ai/summarize-issue` |
| `src/components/ai/issue-summary.tsx` | `<IssueSummary>` — client component with button + panel |

### Updated Files

| File | Change |
|------|--------|
| `src/app/(dashboard)/repos/[owner]/[repo]/issues/[number]/page.tsx` | Add `<IssueSummary>` below issue body |
| `package.json` | Add `@anthropic-ai/sdk` |
| `.env.local` | Add `ANTHROPIC_API_KEY` |

### AI Service Layer (`src/lib/ai/`)

#### `client.ts`
Lazy singleton that creates the Anthropic client once:
```ts
import Anthropic from "@anthropic-ai/sdk"

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}
```

#### `types.ts`
```ts
export interface IssueSummary {
  summary: string
  decisions: string[]
  actionItems: string[]
}
```

#### `prompts.ts`
```ts
export function buildSummaryPrompt(issue: GHIssue, comments: GHComment[]): string
```

Prompt instructs Claude to:
- Read the issue title, body, and all comments
- Return **JSON only** matching the `IssueSummary` schema
- Be concise (summary ≤ 2 sentences)
- Extract only actual decisions and action items — not opinions or questions

### API Route

`POST /api/ai/summarize-issue`

**Request body:**
```json
{ "owner": "string", "repo": "string", "number": 42 }
```

**Flow:**
1. Fetch issue + comments using existing `getIssue()` + `getIssueComments()` from `src/lib/github/client.ts`
2. Build prompt with `buildSummaryPrompt()`
3. Call `anthropic.messages.create({ model: "claude-haiku-4-5-20251001", ... })`
4. Parse JSON from response text
5. Return `IssueSummary` or `{ error: string }`

**Response:**
```json
{
  "summary": "This issue tracks...",
  "decisions": ["Use Redis for caching", "Target Q2 2026"],
  "actionItems": ["Add cache invalidation logic", "Write integration tests"]
}
```

### Component

`src/components/ai/issue-summary.tsx` — Client Component (`"use client"`)

**States:**
- **idle** — shows "Summarize with AI" button
- **loading** — button shows spinner + "Analyzing…" text, disabled
- **success** — collapsible card with summary + decisions + action items
- **error** — inline error message with "Try again" button

**Usage in issue detail page:**
```tsx
<IssueSummary owner={owner} repo={repo} number={issueNumber} />
```

---

## Step 3.2 — Voice-to-Issue Creation (Planned)

### User Flow

1. Click mic button on the repo issue list page
2. Browser `SpeechRecognition` API captures voice
3. Transcript sent to `POST /api/ai/voice-to-issue`
4. Claude parses spoken instruction into structured issue JSON
5. Preview/confirm form shown — user can edit title, description, assignee, labels
6. Confirm → `POST /api/github/repos/[owner]/[repo]/issues/create` → issue created

### New Files (future)

| File | Purpose |
|------|---------|
| `src/lib/ai/prompts.ts` | Add `buildVoiceToIssuePrompt()` |
| `src/lib/ai/types.ts` | Add `ParsedIssue` type |
| `src/app/api/ai/voice-to-issue/route.ts` | Parse transcript → structured JSON |
| `src/app/api/github/repos/[owner]/[repo]/issues/create/route.ts` | Create GitHub issue via Octokit |
| `src/components/ai/voice-input.tsx` | Mic button + `SpeechRecognition` handler |
| `src/components/ai/voice-issue-form.tsx` | Preview/confirm form before issue creation |

### `ParsedIssue` type (future)
```ts
export interface ParsedIssue {
  title: string
  description: string
  assignee: string | null
  labels: string[]
  priority: "high" | "medium" | "low" | null
}
```

---

## Step 3.3 — Sprint Planner (Planned)

### User Flow

1. Navigate to `/sprint-planner`
2. Select repos to pull issues from
3. Configure team capacity: `[{ name: "Alice", hours: 20 }, { name: "Bob", hours: 20 }]`
4. Click "Generate Sprint"
5. Claude groups open issues by assignee, respecting capacity limits
6. Output shows sprint grouped by team member with estimated hours and warnings

### New Files (future)

| File | Purpose |
|------|---------|
| `src/lib/ai/prompts.ts` | Add `buildSprintPlanPrompt()` |
| `src/lib/ai/types.ts` | Add `SprintPlan`, `SprintAssignment` types |
| `src/app/api/ai/sprint-plan/route.ts` | `POST /api/ai/sprint-plan` |
| `src/app/(dashboard)/sprint-planner/page.tsx` | Sprint planner page (Server Component shell) |
| `src/components/sprint/sprint-planner-form.tsx` | Team capacity + repo selector (Client) |
| `src/components/sprint/sprint-result.tsx` | Sprint plan output display |
| `src/hooks/use-sprint-plan.ts` | TanStack Mutation for `/api/ai/sprint-plan` |

### Sprint AI Output schema (future)
```ts
export interface SprintAssignment {
  assignee: string
  tasks: { title: string; issueNumber: number; estimatedHours: number }[]
  totalHours: number
  warning?: string  // e.g. "capacity exceeded"
}

export interface SprintPlan {
  sprint: SprintAssignment[]
  totalCapacity: number
  totalAllocated: number
}
```

---

## MCP Servers

### GitHub MCP (already configured)

`@modelcontextprotocol/server-github` is already in `.claude/settings.json`. Use it during development to:
- List issues from a repo without opening a browser
- Create test issues to verify voice-to-issue output
- Search issues for sprint planner testing

### n8n MCP (already configured)

Use for building automation workflows around Phase 3 features:

**Example workflow — New Issue AI Summary to Slack:**
```
GitHub webhook (issue.opened)
  → n8n trigger
  → fetch issue + comments
  → call /api/ai/summarize-issue
  → send summary to Slack channel
```

**Example workflow — Weekly Sprint Reminder:**
```
Monday 09:00 cron
  → fetch open issues
  → call /api/ai/sprint-plan
  → post sprint plan to Slack
```

---

## Skills

### `claude-developer-platform` (already configured)

Invoke this skill when writing any code that imports `@anthropic-ai/sdk`. It provides:
- Up-to-date Claude API documentation
- Structured output / tool use patterns
- Streaming response examples
- Model selection guidance

---

## Verification Checklist

### Step 3.1 (AI Summarizer)

```bash
pnpm add @anthropic-ai/sdk
pnpm tsc --noEmit   # zero errors
pnpm build          # clean build
pnpm dev
```

Manual test:
- [ ] Open any issue with at least 1 comment
- [ ] Click "Summarize with AI" — spinner appears
- [ ] Summary card renders with all three sections (summary, decisions, action items)
- [ ] Open an issue with no comments — summary still works (issue body only)
- [ ] Simulate API error (invalid key) — error message + retry button shown
