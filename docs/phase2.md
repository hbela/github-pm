# Phase 2 — Kanban Board

## Overview

Phase 2 adds a **Kanban board** that reads and writes to **GitHub Projects v2** via the GraphQL API, with drag-and-drop powered by **dnd-kit** and optimistic UI updates via TanStack Query mutations.

**New routes:**
- `/projects` — lists the user's GitHub Projects v2
- `/projects/[projectId]` — Kanban board for that project

**Key facts:**
- `@octokit/graphql` (v9.0.3) is already installed — no additional GraphQL client needed
- `dnd-kit` must be added

---

## Step 1 — Install dnd-kit

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Step 2 — New domain types

**File:** `src/lib/github/types.ts`

Add alongside existing types:

```ts
export interface GHProject {
  id: string        // node ID (used in GraphQL mutations)
  number: number
  title: string
  url: string
}

export interface GHProjectFieldOption {
  id: string        // singleSelectOptionId used in mutation
  name: string      // "Todo", "In Progress", "Done", etc.
  color: string     // GitHub color name
}

export interface GHProjectField {
  id: string
  name: string      // typically "Status"
  options: GHProjectFieldOption[]
}

export interface GHProjectItem {
  id: string        // item node ID
  issue: GHIssue
  statusOptionId: string | null
}

export interface KanbanColumn {
  optionId: string
  name: string
  color: string
  items: GHProjectItem[]
}
```

---

## Step 3 — GraphQL client

**File:** `src/lib/github/graphql.ts` *(new)*

Uses `@octokit/graphql` with the session access token (same auth pattern as `client.ts`).

| Function | Description |
|---|---|
| `getGraphQLClient()` | Creates authenticated `graphql` instance via `auth()` from NextAuth |
| `getUserProjects()` | Lists viewer's ProjectV2 → `GHProject[]` |
| `getProjectBoard(projectId)` | Fetches project + Status field + all items with fieldValues → board data |
| `updateProjectItemStatus(projectId, itemId, fieldId, optionId)` | Mutation: moves a card to a new column |

**GraphQL query for board:**
```graphql
query GetProjectBoard($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      title
      url
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name color }
          }
        }
      }
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue {
              number title body state url
              author { login avatarUrl }
              labels(first: 10) { nodes { id name color } }
              assignees(first: 5) { nodes { login avatarUrl } }
              milestone { number title dueOn state }
              comments { totalCount }
              repository { nameWithOwner }
              createdAt updatedAt closedAt
            }
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                optionId
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}
```

**GraphQL mutation for status update:**
```graphql
mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }
  ) {
    projectV2Item { id }
  }
}
```

---

## Step 4 — Mappers

**File:** `src/lib/github/mappers.ts`

Add `mapProject()` and `mapProjectItem()` alongside existing mappers. `mapProjectItem()` reuses the existing `mapIssue()`.

---

## Step 5 — API routes

| Route | Method | Handler |
|---|---|---|
| `src/app/api/github/projects/route.ts` | GET | Returns `GHProject[]` |
| `src/app/api/github/projects/[projectId]/board/route.ts` | GET | Returns `{ project, statusField, columns: KanbanColumn[] }` |
| `src/app/api/github/projects/[projectId]/items/[itemId]/route.ts` | PATCH `{ fieldId, optionId }` | Calls `updateProjectItemStatus`, returns 200 |

All routes call `auth()` — token stays server-side.

---

## Step 6 — TanStack Query hooks

| Hook | File |
|---|---|
| `useProjects()` | `src/hooks/use-projects.ts` |
| `useProjectBoard(projectId)` | `src/hooks/use-project-board.ts` |
| `useMoveItem(projectId)` | `src/hooks/use-move-item.ts` |

`useMoveItem` implements **optimistic updates**:
- `onMutate`: snapshots current board state, applies column swap immediately
- `onError`: rolls back to snapshot
- `onSettled`: invalidates `useProjectBoard` query to sync from server

---

## Step 7 — Kanban components

**Directory:** `src/components/kanban/`

| File | Description |
|---|---|
| `card.tsx` | `DraggableCard` — `useDraggable`, renders issue title, labels (colored badges), assignee avatars, comment count |
| `column.tsx` | `DroppableColumn` — `useDroppable`, renders column header (name, item count) + stacked cards |
| `board.tsx` | `KanbanBoard` (Client Component) — `DndContext` + `SortableContext`, handles `onDragEnd` to call `useMoveItem` mutation |
| `board-skeleton.tsx` | Loading skeleton: 3 columns × 4 card placeholders |

`KanbanBoard` derives column structure from `KanbanColumn[]` passed as props from the server.

---

## Step 8 — Projects list page

**File:** `src/app/(dashboard)/projects/page.tsx`

Server Component, Suspense-wrapped. Renders a grid of project cards (title, item count) linking to `/projects/[projectId]`. Same pattern as the dashboard repo grid.

---

## Step 9 — Kanban board page

**File:** `src/app/(dashboard)/projects/[projectId]/page.tsx`

Server Component that calls `getProjectBoard()` and passes `columns`, `statusField`, and `projectId` as props to `<KanbanBoard>` (Client Component).

---

## Step 10 — Navigation

**File:** `src/components/layout/header.tsx`

Add a **"Projects"** nav link pointing to `/projects`, next to the existing dashboard link.

---

## Architecture Notes

- **Server → Client split**: The page Server Component fetches initial board state; `<KanbanBoard>` is a Client Component for interactivity. No re-fetch on drag.
- **Token safety**: `getGraphQLClient()` uses NextAuth `auth()` — identical pattern to Phase 1's `getGithubClient()`.
- **Optimistic UI**: Drag feels instant. Network failure → card snaps back.
- **No Radix / asChild**: All new components use Base UI primitives or plain HTML — consistent with Phase 1 shadcn v4 rules.

---

## File Summary

### Modified
- `src/lib/github/types.ts`
- `src/lib/github/mappers.ts`
- `src/components/layout/header.tsx`

### Created
- `src/lib/github/graphql.ts`
- `src/app/api/github/projects/route.ts`
- `src/app/api/github/projects/[projectId]/board/route.ts`
- `src/app/api/github/projects/[projectId]/items/[itemId]/route.ts`
- `src/hooks/use-projects.ts`
- `src/hooks/use-project-board.ts`
- `src/hooks/use-move-item.ts`
- `src/components/kanban/card.tsx`
- `src/components/kanban/column.tsx`
- `src/components/kanban/board.tsx`
- `src/components/kanban/board-skeleton.tsx`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/projects/[projectId]/page.tsx`

---

## Verification Checklist

- [ ] `pnpm build` passes with no TypeScript errors
- [ ] `/projects` renders a list of the user's GitHub Projects v2
- [ ] `/projects/[projectId]` renders columns matching the project's Status field options
- [ ] Dragging a card to another column moves it instantly (optimistic)
- [ ] After drag, the GitHub project item reflects the new status
- [ ] Hard-refreshing the board shows the card in its new column
- [ ] Simulating network failure (DevTools → offline) causes the card to snap back
