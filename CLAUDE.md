# CLAUDE.md — GitHub PM

AI-powered GitHub project management UI built on Next.js 15.

## Commands

```bash
pnpm dev        # Dev server (http://localhost:3000)
pnpm build      # Production build
pnpm tsc --noEmit  # Type check
pnpm lint       # ESLint
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui v4 — uses **Base UI** (`@base-ui/react`), NOT Radix UI |
| Auth | NextAuth.js v5 beta — GitHub OAuth |
| GitHub API | Octokit v5 (REST) + `@octokit/graphql` v9 (GraphQL for Projects v2) |
| Drag & Drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) |
| Data fetching | TanStack Query v5 |
| Package manager | pnpm |

## Key Architecture Rules

### shadcn/ui uses Base UI — not Radix
This project uses the new shadcn/ui v4 which is built on `@base-ui/react` instead of `@radix-ui`.

- **No `asChild` prop** on any component — Base UI does not support it
- Use `render` prop for custom element rendering, or nest content directly inside triggers
- `DropdownMenuTrigger` accepts children directly — no wrapper `<Button asChild>` needed
- `Select` is `SelectPrimitive.Root` — `onValueChange` callback type is `(value: string | null) => void`
- Add shadcn components: `pnpm dlx shadcn@latest add <component>`

### GitHub API is server-only
- The GitHub access token is **never sent to the browser**
- REST calls (Octokit) happen in Server Components or API route handlers via `src/lib/github/client.ts`
- GraphQL calls (`@octokit/graphql`) happen in Server Components or API route handlers via `src/lib/github/graphql.ts`
- Both use `auth()` from NextAuth to get the token — server-side only
- Client components fetch via `/api/github/...` routes (TanStack Query hooks in `src/hooks/`)

### Server Components + Suspense pattern
Pages are Server Components that fetch data directly. Wrap async content in `<Suspense fallback={<Skeleton />}>` with a sibling async component for the data fetch.

### Kanban board pattern
The board page is a Server Component that fetches initial data and passes it as props to `<KanbanBoard>` (Client Component). Local `useState` handles optimistic drag-and-drop; `useMoveItem` persists changes via PATCH. On error, state rolls back to the snapshot.

### URL search params for filters
Issue filters (state, label, milestone, sort) are stored in URL search params. Filter UI is a Client Component using `useSearchParams` + `useRouter` to update the URL without a full page reload.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Auth-gated route group (redirects to /login if no session)
│   │   ├── layout.tsx            # Checks session, renders Header
│   │   ├── page.tsx              # Dashboard: stats + repo grid
│   │   ├── projects/
│   │   │   ├── page.tsx          # Projects list (GitHub Projects v2)
│   │   │   └── [projectId]/page.tsx  # Kanban board for a project
│   │   └── repos/[owner]/[repo]/
│   │       ├── page.tsx          # Issue list with filters
│   │       └── issues/[number]/page.tsx  # Issue detail + comments
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── github/
│   │       ├── repos/route.ts
│   │       ├── repos/[owner]/[repo]/issues/route.ts
│   │       ├── projects/route.ts                          # GET list of projects
│   │       ├── projects/[projectId]/board/route.ts        # GET board columns + items
│   │       └── projects/[projectId]/items/[itemId]/route.ts  # PATCH move card
│   ├── login/page.tsx
│   ├── layout.tsx
│   └── providers.tsx
├── auth.ts                       # NextAuth config — scope includes "project" for Projects v2
├── lib/
│   └── github/
│       ├── client.ts             # Octokit (REST): repos, issues, comments, labels, milestones
│       ├── graphql.ts            # @octokit/graphql: getUserProjects, getProjectBoard, updateProjectItemStatus
│       ├── types.ts              # Domain models (GHRepo, GHIssue, GHProject, KanbanColumn, etc.)
│       └── mappers.ts            # REST response → domain types
├── components/
│   ├── layout/header.tsx         # Sticky nav — logo + Projects link + avatar dropdown
│   ├── dashboard/
│   │   ├── repo-card.tsx
│   │   └── stats-card.tsx
│   ├── issues/
│   │   ├── issue-row.tsx
│   │   ├── issue-filters.tsx
│   │   └── comment-list.tsx
│   ├── kanban/
│   │   ├── board.tsx             # KanbanBoard (client) — DndContext, optimistic state
│   │   ├── column.tsx            # DroppableColumn — useDroppable
│   │   ├── card.tsx              # DraggableCard — useDraggable, labels, assignees
│   │   └── board-skeleton.tsx    # Loading skeleton
│   └── ui/                       # shadcn auto-generated components
└── hooks/
    ├── use-repos.ts
    ├── use-issues.ts
    ├── use-projects.ts           # TanStack Query: fetch GHProject[]
    ├── use-project-board.ts      # TanStack Query: fetch ProjectBoard
    └── use-move-item.ts          # TanStack Mutation: PATCH item status
```

## Environment Variables

```env
AUTH_GITHUB_ID=          # GitHub OAuth App Client ID
AUTH_GITHUB_SECRET=      # GitHub OAuth App Client Secret
AUTH_SECRET=             # Random secret for NextAuth JWT signing
NEXTAUTH_URL=http://localhost:3000
```

GitHub OAuth App callback URL: `http://localhost:3000/api/auth/callback/github`

OAuth scope: `read:user user:email repo project` — the `project` scope is required for GitHub Projects v2 GraphQL read/write. Users must re-authenticate after a scope change.

## Domain Models (src/lib/github/types.ts)

**Phase 1 (REST)**
- `GHRepo` — repository with owner, stars, forks, open issue count
- `GHIssue` — issue with labels, assignees, milestone, comment count
- `GHComment` — comment with author and markdown body
- `GHLabel`, `GHUser`, `GHMilestone` — supporting types
- `IssueFilters` — filter/sort options for `getRepoIssues()`

**Phase 2 (GraphQL Projects v2)**
- `GHProject` — project with GraphQL node ID, number, title, url
- `GHProjectField` — single-select field (Status) with options
- `GHProjectFieldOption` — option with id (used in mutations), name, color
- `GHProjectItem` — project item linking an issue to its statusOptionId
- `KanbanColumn` — column grouping items by status option

GraphQL mappers are internal to `src/lib/github/graphql.ts` (camelCase from GitHub API). REST mappers live in `mappers.ts` (snake_case).

## GitHub API Functions

### REST — `src/lib/github/client.ts`

| Function | Description |
|----------|-------------|
| `getAuthenticatedUser()` | Current user info |
| `getUserRepos()` | All repos (owner + collaborator + org) |
| `getRepo(owner, repo)` | Single repo details |
| `getRepoIssues(owner, repo, filters)` | Paginated issue list (excludes PRs) |
| `getIssue(owner, repo, number)` | Single issue |
| `getIssueComments(owner, repo, number)` | Issue comments |
| `getRepoLabels(owner, repo)` | All labels |
| `getRepoMilestones(owner, repo)` | Open milestones |

### GraphQL — `src/lib/github/graphql.ts`

| Function | Description |
|----------|-------------|
| `getUserProjects()` | Lists viewer's GitHub Projects v2 |
| `getProjectBoard(projectId)` | Fetches project + Status field + items grouped into KanbanColumns |
| `updateProjectItemStatus(projectId, itemId, fieldId, optionId)` | Moves a card to a new column |

## Next Phase: Phase 3

Phase 3 candidates (from PRD):
- AI issue summarizer (Claude API)
- Voice-to-issue creation (Web Speech API → Claude → GitHub issue)
- Sprint planner AI suggestions
