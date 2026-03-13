import type {
  GHRepo,
  GHIssue,
  GHComment,
  GHLabel,
  GHUser,
  GHMilestone,
} from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRepo(raw: any): GHRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    private: raw.private,
    stargazersCount: raw.stargazers_count,
    forksCount: raw.forks_count,
    openIssuesCount: raw.open_issues_count,
    updatedAt: raw.updated_at,
    htmlUrl: raw.html_url,
    defaultBranch: raw.default_branch,
    language: raw.language,
    owner: mapUser(raw.owner),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUser(raw: any): GHUser {
  return {
    login: raw.login,
    avatarUrl: raw.avatar_url,
    htmlUrl: raw.html_url,
    name: raw.name ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLabel(raw: any): GHLabel {
  return {
    id: raw.id,
    name: raw.name,
    color: raw.color,
    description: raw.description ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMilestone(raw: any): GHMilestone | null {
  if (!raw) return null
  return {
    number: raw.number,
    title: raw.title,
    dueOn: raw.due_on,
    state: raw.state,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapIssue(raw: any, repoFullName: string): GHIssue {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    body: raw.body ?? null,
    state: raw.state,
    labels: (raw.labels ?? []).map(mapLabel),
    assignees: (raw.assignees ?? []).map(mapUser),
    milestone: mapMilestone(raw.milestone),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    closedAt: raw.closed_at ?? null,
    htmlUrl: raw.html_url,
    author: mapUser(raw.user),
    commentsCount: raw.comments,
    repoFullName,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapComment(raw: any): GHComment {
  return {
    id: raw.id,
    body: raw.body ?? "",
    author: mapUser(raw.user),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    htmlUrl: raw.html_url,
  }
}
