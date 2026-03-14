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
| GitHub API | Octokit v5 (REST) |
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
- All Octokit calls happen in Server Components or API route handlers
- Client components fetch via `/api/github/...` routes (TanStack Query hooks in `src/hooks/`)
- `src/lib/github/client.ts` calls `auth()` from NextAuth — only works server-side

### Server Components + Suspense pattern
Pages are Server Components that fetch data directly. Wrap async content in `<Suspense fallback={<Skeleton />}>` with a sibling async component for the data fetch.

### URL search params for filters
Issue filters (state, label, milestone, sort) are stored in URL search params. Filter UI is a Client Component using `useSearchParams` + `useRouter` to update the URL without a full page reload.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Auth-gated route group (redirects to /login if no session)
│   │   ├── layout.tsx            # Checks session, renders Header
│   │   ├── page.tsx              # Dashboard: stats + repo grid
│   │   └── repos/[owner]/[repo]/
│   │       ├── page.tsx          # Issue list with filters
│   │       └── issues/[number]/page.tsx  # Issue detail + comments
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   └── github/
│   │       ├── repos/route.ts            # GET /api/github/repos
│   │       └── repos/[owner]/[repo]/issues/route.ts
│   ├── login/page.tsx            # GitHub OAuth login
│   ├── layout.tsx                # Root layout — wraps with <Providers>
│   └── providers.tsx             # QueryClientProvider + SessionProvider (client)
├── auth.ts                       # NextAuth config (GitHub provider, JWT callbacks)
├── lib/
│   └── github/
│       ├── client.ts             # Octokit factory + all API functions
│       ├── types.ts              # Clean domain models (GHRepo, GHIssue, etc.)
│       └── mappers.ts            # Raw Octokit response → domain types
├── components/
│   ├── layout/header.tsx         # Sticky nav with avatar dropdown + sign out
│   ├── dashboard/
│   │   ├── repo-card.tsx         # Repo grid card
│   │   └── stats-card.tsx        # Summary stat card
│   ├── issues/
│   │   ├── issue-row.tsx         # Single issue row in list
│   │   ├── issue-filters.tsx     # Filter dropdowns (client component)
│   │   └── comment-list.tsx      # Issue comments with Markdown rendering
│   └── ui/                       # shadcn auto-generated components
└── hooks/
    ├── use-repos.ts              # TanStack Query: fetch repos
    └── use-issues.ts             # TanStack Query: fetch issues
```

## Environment Variables

```env
AUTH_GITHUB_ID=          # GitHub OAuth App Client ID
AUTH_GITHUB_SECRET=      # GitHub OAuth App Client Secret
AUTH_SECRET=             # Random secret for NextAuth JWT signing
NEXTAUTH_URL=http://localhost:3000
```

GitHub OAuth App callback URL: `http://localhost:3000/api/auth/callback/github`

## Domain Models (src/lib/github/types.ts)

- `GHRepo` — repository with owner, stars, forks, open issue count
- `GHIssue` — issue with labels, assignees, milestone, comment count
- `GHComment` — comment with author and markdown body
- `GHLabel`, `GHUser`, `GHMilestone` — supporting types
- `IssueFilters` — filter/sort options for `getRepoIssues()`

Always use the mapping layer (`mappers.ts`) — never use raw Octokit response shapes in components.

## GitHub API Functions (src/lib/github/client.ts)

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

## Next Phase: Kanban Board

Phase 2 will add:
- `dnd-kit` for drag-and-drop
- GitHub Projects GraphQL API (v2) for reading/writing project item status
- Multi-repo Kanban board view
- Optimistic UI updates with TanStack Query mutations
