# Phase 4 — Pull Requests, AI Agent, Meeting Notes, Webhooks, Calendar

## Overview

Phase 4 completes the remaining features from the PRD, turning the app into a full-featured **AI GitHub Project Manager**. Every step builds on the infrastructure from Phases 1–3 (auth, Kanban, Claude API, voice-to-issue, sprint planner).

### Feature Roadmap

| Step | Feature | Status |
|------|---------|--------|
| 4.1 | Pull Request Management | Next to implement |
| 4.2 | AI Agent Dashboard | Planned |
| 4.3 | Meeting Notes → Issues | Planned |
| 4.4 | GitHub Webhook Integration | Planned |
| 4.5 | Calendar View | Planned |

---

## Step 4.1 — Pull Request Management

### User Flow

1. In any repo view (`/repos/[owner]/[repo]`), a **"Pull Requests"** tab appears alongside the existing "Issues" tab
2. PR list shows: title, number, state (open/merged/closed), author avatar, labels, reviewers, CI check status badge, age
3. Click a PR → `/repos/[owner]/[repo]/pulls/[number]` — PR detail page with body (rendered Markdown), review status, commits list, and file change count
4. Kanban cards for issues that have a linked PR display a small PR status badge (open / merged / checks failing)

### New Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/repos/[owner]/[repo]/pulls/page.tsx` | PR list page (Server Component) |
| `src/app/(dashboard)/repos/[owner]/[repo]/pulls/[number]/page.tsx` | PR detail page (Server Component) |
| `src/components/prs/pr-row.tsx` | Single PR row — state badge, author, labels, review status |
| `src/components/prs/pr-status-badge.tsx` | Reusable badge: open / merged / closed / draft |

### Updated Files

| File | Change |
|------|--------|
| `src/lib/github/client.ts` | Add `getRepoPullRequests()`, `getPullRequest()`, `getPullRequestReviews()` |
| `src/lib/github/types.ts` | Add `GHPullRequest`, `GHReview`, `PRState` types |
| `src/lib/github/mappers.ts` | Add `mapPullRequest()` mapper |
| `src/app/(dashboard)/repos/[owner]/[repo]/page.tsx` | Add "Pull Requests" tab; default tab is Issues |
| `src/components/kanban/card.tsx` | Show PR status badge when a card's issue has a linked PR |
| `src/hooks/use-issues.ts` | Add `usePullRequests()` TanStack Query hook |

### New Domain Types (`src/lib/github/types.ts`)

```ts
export type PRState = "open" | "closed" | "merged"

export interface GHPullRequest {
  number: number
  title: string
  body: string | null
  state: PRState
  draft: boolean
  author: GHUser
  labels: GHLabel[]
  assignees: GHUser[]
  reviewers: GHUser[]
  headBranch: string
  baseBranch: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  checksStatus: "success" | "failure" | "pending" | "none"
  url: string
}
```

### API Functions (`src/lib/github/client.ts`)

```ts
export async function getRepoPullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GHPullRequest[]>

export async function getPullRequest(
  owner: string,
  repo: string,
  number: number
): Promise<GHPullRequest>
```

Both use the server-side Octokit instance from `getOctokit()` (requires `auth()` — server only).

---

## Step 4.2 — AI Agent Dashboard

### User Flow

1. Click **"AI Agent"** in the header nav (BrainCircuit icon)
2. Navigate to `/ai-agent`
3. Select a repo (or "all repos") and click **"Run Analysis"**
4. Claude analyzes recent issues + PRs and returns a structured insight report:
   - **Blockers** — inactive issues (>5 days no activity), failing PRs
   - **Duplicate Issues** — pairs of issues with similar descriptions
   - **Task Suggestions** — missing work items based on recent code/issue patterns
   - **Daily Stand-up Report** — yesterday's activity + today's planned work + blockers
5. Each insight card has an optional action button (e.g. "Create Issue", "View PR")

### New Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/ai-agent/page.tsx` | AI Agent page (Server Component shell) |
| `src/components/ai/agent-dashboard.tsx` | `<AgentDashboard>` — repo selector + Run Analysis button + insights grid (Client) |
| `src/components/ai/insight-card.tsx` | Single insight card — severity icon, message, optional action |
| `src/components/ai/standup-report.tsx` | Stand-up report display — Yesterday / Today / Blockers sections |
| `src/app/api/ai/agent-analysis/route.ts` | `POST /api/ai/agent-analysis` |
| `src/hooks/use-agent-analysis.ts` | TanStack Mutation for `/api/ai/agent-analysis` |

### Updated Files

| File | Change |
|------|--------|
| `src/lib/ai/types.ts` | Add `AgentInsight`, `AgentReport`, `StandupReport` types |
| `src/lib/ai/prompts.ts` | Add `buildAgentAnalysisPrompt()`, `buildStandupPrompt()` |
| `src/components/layout/header.tsx` | Add "AI Agent" nav link (BrainCircuit icon) |

### New Types (`src/lib/ai/types.ts`)

```ts
export interface AgentInsight {
  type: "blocker" | "duplicate" | "suggestion" | "info"
  severity: "high" | "medium" | "low"
  message: string
  issueNumbers?: number[]
  actionLabel?: string
  actionUrl?: string
}

export interface StandupReport {
  yesterday: string[]   // activity items
  today: string[]       // planned items
  blockers: string[]    // current blockers
}

export interface AgentReport {
  insights: AgentInsight[]
  standup: StandupReport
  generatedAt: string
}
```

### API Route

`POST /api/ai/agent-analysis`

**Request body:**
```json
{ "owner": "string", "repo": "string" }
```

**Flow:**
1. Fetch last 30 open issues + recent PRs using `getRepoIssues()` + `getRepoPullRequests()`
2. Build prompt with `buildAgentAnalysisPrompt(issues, prs)`
3. Call Claude with `claude-opus-4-6` model, JSON output mode
4. Parse response into `AgentReport`
5. Return `AgentReport` or `{ error: string }`

---

## Step 4.3 — Meeting Notes → Issues

### User Flow

1. In any repo issue list page, a **"Meeting Notes"** button appears next to the existing "Voice Issue" button
2. A modal/panel opens with a large textarea
3. User pastes meeting notes or any free-form text
4. Click **"Extract Issues"** → Claude returns an array of `ParsedIssue` objects
5. Each parsed issue is shown as a card with a checkbox (all checked by default)
6. User can edit title/description inline, uncheck issues to skip
7. Click **"Create Selected Issues"** → bulk-creates all checked issues via Octokit
8. Success toast shows count of created issues with links

### New Files

| File | Purpose |
|------|---------|
| `src/components/ai/meeting-notes-extractor.tsx` | Modal — textarea + Extract button + parsed issue checklist + Create button (Client) |
| `src/app/api/ai/meeting-notes/route.ts` | `POST /api/ai/meeting-notes` — notes → `ParsedIssue[]` |
| `src/app/api/github/repos/[owner]/[repo]/issues/bulk-create/route.ts` | `POST` — bulk Octokit issue creation |

### Updated Files

| File | Change |
|------|--------|
| `src/lib/ai/prompts.ts` | Add `buildMeetingNotesPrompt()` |
| `src/lib/ai/types.ts` | Add `BulkCreateResult` type |
| `src/app/(dashboard)/repos/[owner]/[repo]/page.tsx` | Add "Meeting Notes" button in the filter bar |

### Prompt Design (`buildMeetingNotesPrompt`)

Instructs Claude to:
- Extract every distinct task, action item, or bug mentioned in the text
- Return a JSON array of `ParsedIssue` objects
- Do not invent tasks not present in the notes
- Use concise titles (≤ 80 chars); include context in description

### API Route

`POST /api/ai/meeting-notes`

**Request body:**
```json
{ "notes": "string" }
```

**Response:**
```json
[
  { "title": "Add OAuth integration", "description": "...", "assignee": null, "labels": ["backend"], "priority": "high" },
  { "title": "Fix login bug", "description": "...", "assignee": "bela", "labels": ["bug"], "priority": "high" }
]
```

---

## Step 4.4 — GitHub Webhook Integration

### User Flow (no direct UI interaction)

1. Admin registers webhook at `https://your-domain.com/api/github/webhook` in the GitHub repo settings (Content type: `application/json`)
2. GitHub sends events: `issues`, `pull_request`, `project_v2_item`, `push`
3. The webhook endpoint verifies the HMAC-SHA256 signature, then processes the event
4. Processed events are stored in a lightweight in-memory event log (or logged to console in dev)
5. The UI polls `/api/github/events/latest` to detect changes and triggers TanStack Query cache invalidation — enabling near-real-time board updates without WebSockets

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/github/webhook/route.ts` | `POST /api/github/webhook` — signature verification + event dispatch |
| `src/lib/github/webhook.ts` | `verifyWebhookSignature()`, `processWebhookEvent()`, event type guards |
| `src/app/api/github/events/latest/route.ts` | `GET` — returns timestamp/hash of last processed event for polling |

### Updated Files

| File | Change |
|------|--------|
| `.env.local` | Add `GITHUB_WEBHOOK_SECRET` |

### New Environment Variable

```env
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

Set this value in both `.env.local` and in the GitHub repo webhook settings (must match exactly).

### Signature Verification (`src/lib/github/webhook.ts`)

```ts
import { createHmac, timingSafeEqual } from "crypto"

export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

### Supported Events

| GitHub event | Action taken |
|---|---|
| `issues.opened` / `issues.edited` / `issues.closed` | Update event log (invalidates issue list on next poll) |
| `pull_request.opened` / `pull_request.merged` | Update event log (invalidates PR list on next poll) |
| `project_v2_item.edited` | Update event log (invalidates board on next poll) |
| `push` | Log commit metadata for AI agent stand-up |

---

## Step 4.5 — Calendar View

### User Flow

1. Click **"Calendar"** in the header nav (CalendarDays icon)
2. Navigate to `/calendar`
3. Monthly calendar grid is shown — current month by default
4. Events displayed:
   - **Milestones** with `due_on` date — shown as colored chips on their due date
   - **Issues assigned to the current user** — shown on `created_at` date with a small dot
5. Click left/right arrows to navigate months (updates `?month=YYYY-MM` URL param)
6. Click a milestone chip → navigates to the corresponding repo page
7. Click an issue dot/chip → navigates to the issue detail page

### New Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/calendar/page.tsx` | Calendar page — reads `?month` param, fetches data (Server Component) |
| `src/components/calendar/calendar-grid.tsx` | `<CalendarGrid>` — 7-column CSS grid month view (Client Component) |
| `src/components/calendar/calendar-event.tsx` | Small chip for milestone or issue shown on a day cell |
| `src/app/api/github/calendar/route.ts` | `GET /api/github/calendar?month=YYYY-MM` — milestones + assigned issues |
| `src/hooks/use-calendar.ts` | TanStack Query hook for `/api/github/calendar` |

### Updated Files

| File | Change |
|------|--------|
| `src/lib/github/client.ts` | Add `getAssignedIssues()` — issues assigned to current user across all repos |
| `src/lib/github/types.ts` | Add `CalendarEvent` union type |
| `src/components/layout/header.tsx` | Add "Calendar" nav link (CalendarDays icon) |

### New Types (`src/lib/github/types.ts`)

```ts
export type CalendarEvent =
  | { kind: "milestone"; title: string; repo: string; dueOn: string; url: string }
  | { kind: "issue"; title: string; repo: string; number: number; date: string; url: string }
```

### Calendar API Route

`GET /api/github/calendar?month=2026-04`

**Flow:**
1. Parse `month` param → derive start/end dates for the month
2. Fetch all user repos (`getUserRepos()`), then `getRepoMilestones()` for each — filter by `due_on` in range
3. Fetch `getAssignedIssues()` — filter by `created_at` in range
4. Return `CalendarEvent[]`

### Calendar Grid Implementation

- No external calendar library — built with CSS grid (7 columns, `auto` rows)
- Each day cell lists up to 3 events; overflow shown as "+ N more" chip
- `date-fns` (already installed) handles month generation, day-of-week offset, `format()`
- Month navigation updates `?month=YYYY-MM` search param so the page is shareable and server-renderable

---

## MCP Servers

### GitHub MCP (already configured)

Use during development to:
- Create test PRs and issues to verify step 4.1 rendering
- Inspect webhook delivery history in GitHub's webhook settings UI
- List milestones to verify calendar population

### n8n MCP (already configured)

Phase 4 n8n automation examples:

**Issue inactivity reminder:**
```
Daily 09:00 cron
  → fetch open issues via /api/github/calendar
  → filter inactive > 5 days
  → send Slack/email reminder
```

**New PR → AI insights notification:**
```
GitHub webhook pull_request.opened
  → n8n trigger
  → call POST /api/ai/agent-analysis
  → post insight summary to Slack channel
```

**Weekly meeting prep:**
```
Friday 16:00 cron
  → call POST /api/ai/agent-analysis (all repos)
  → format stand-up report
  → send to team email / Slack
```

---

## Verification Checklist

### Step 4.1 (Pull Requests)

```bash
pnpm tsc --noEmit   # zero errors
pnpm build          # clean build
pnpm dev
```

Manual test:
- [ ] `/repos/[owner]/[repo]` shows Issues and Pull Requests tabs
- [ ] PR list renders with state badges, author avatars, label chips
- [ ] Draft PRs show a "Draft" badge
- [ ] Click a PR → detail page renders body as Markdown, shows review status
- [ ] Kanban card for an issue with a linked PR shows PR status badge

### Step 4.2 (AI Agent Dashboard)

- [ ] `/ai-agent` page loads with repo selector dropdown
- [ ] "Run Analysis" spinner appears, then insight cards render
- [ ] Each card shows correct icon: ⚠ blocker, 💡 suggestion, 🔁 duplicate, ℹ info
- [ ] Stand-up section shows Yesterday / Today / Blockers
- [ ] "AI Agent" link visible in header nav

### Step 4.3 (Meeting Notes → Issues)

- [ ] "Meeting Notes" button appears in repo issue list filter bar
- [ ] Textarea modal opens on click
- [ ] Paste notes → click "Extract Issues" → parsed list with checkboxes renders
- [ ] Uncheck an issue → it is excluded from creation
- [ ] Inline title edit works
- [ ] "Create Selected Issues" creates only checked issues on GitHub
- [ ] Success toast shows created issue numbers and links

### Step 4.4 (GitHub Webhook)

```bash
# Use smee.io or ngrok to expose localhost for webhook testing
npx smee-client --url https://smee.io/XXXXX --target http://localhost:3000/api/github/webhook
```

- [ ] Endpoint returns `401` on missing or invalid signature
- [ ] Endpoint returns `200` on valid `issues` event payload
- [ ] Event log updates after issue open/close
- [ ] Board page auto-detects change and re-fetches within polling interval

### Step 4.5 (Calendar)

- [ ] `/calendar` renders current month grid (7 columns, correct day-of-week offset)
- [ ] Milestones with `due_on` appear on the correct day cell
- [ ] Assigned issues appear as dots/chips on their creation date
- [ ] Month navigation prev/next works and updates `?month=` URL param
- [ ] Clicking a milestone chip navigates to its repo page
- [ ] "Calendar" link visible in header nav
