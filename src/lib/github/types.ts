export interface GHUser {
  login: string
  avatarUrl: string
  htmlUrl: string
  name?: string | null
}

export interface GHLabel {
  id: string  // numeric REST id or GraphQL node ID — always stored as string
  name: string
  color: string
  description?: string | null
}

export interface GHMilestone {
  number: number
  title: string
  dueOn: string | null
  state: "open" | "closed"
}

export interface GHRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  updatedAt: string
  htmlUrl: string
  defaultBranch: string
  owner: GHUser
  language: string | null
}

export interface GHIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  labels: GHLabel[]
  assignees: GHUser[]
  milestone: GHMilestone | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  htmlUrl: string
  author: GHUser
  commentsCount: number
  repoFullName: string
}

export interface GHComment {
  id: number
  body: string
  author: GHUser
  createdAt: string
  updatedAt: string
  htmlUrl: string
}

export interface GHPullRequest {
  id: number
  number: number
  title: string
  state: "open" | "closed" | "merged"
  draft: boolean
  author: GHUser
  createdAt: string
  updatedAt: string
  htmlUrl: string
}

export interface IssueFilters {
  state?: "open" | "closed" | "all"
  labels?: string[]
  milestone?: string
  assignee?: string
  sort?: "created" | "updated" | "comments"
  direction?: "asc" | "desc"
  page?: number
  perPage?: number
}

// --- GitHub Projects v2 ---

export interface GHProject {
  id: string        // GraphQL node ID (used in mutations)
  number: number
  title: string
  url: string
}

export interface GHProjectFieldOption {
  id: string        // singleSelectOptionId used in updateProjectV2ItemFieldValue
  name: string      // e.g. "Todo", "In Progress", "Done"
  color: string     // GitHub color name (RED, GREEN, BLUE, etc.)
}

export interface GHProjectField {
  id: string
  name: string      // typically "Status"
  options: GHProjectFieldOption[]
}

export interface GHProjectItem {
  id: string        // GraphQL item node ID
  issue: GHIssue
  statusOptionId: string | null
}

export interface KanbanColumn {
  optionId: string
  name: string
  color: string
  items: GHProjectItem[]
}
