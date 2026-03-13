export interface GHUser {
  login: string
  avatarUrl: string
  htmlUrl: string
  name?: string | null
}

export interface GHLabel {
  id: number
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
