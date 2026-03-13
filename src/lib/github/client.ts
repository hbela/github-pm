import { Octokit } from "octokit"
import { auth } from "@/auth"
import { mapRepo, mapIssue, mapComment } from "./mappers"
import type { GHRepo, GHIssue, GHComment, GHUser, IssueFilters } from "./types"

export async function getGithubClient() {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }
  return new Octokit({ auth: session.accessToken })
}

export async function getAuthenticatedUser(): Promise<GHUser> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.users.getAuthenticated()
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    name: data.name ?? null,
  }
}

export async function getUserRepos(): Promise<GHRepo[]> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
    affiliation: "owner,collaborator,organization_member",
  })
  return data.map(mapRepo)
}

export async function getRepo(owner: string, repo: string): Promise<GHRepo> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.repos.get({ owner, repo })
  return mapRepo(data)
}

export async function getRepoIssues(
  owner: string,
  repo: string,
  filters: IssueFilters = {}
): Promise<GHIssue[]> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: filters.state ?? "open",
    labels: filters.labels?.join(","),
    milestone: filters.milestone,
    assignee: filters.assignee,
    sort: filters.sort ?? "updated",
    direction: filters.direction ?? "desc",
    per_page: filters.perPage ?? 30,
    page: filters.page ?? 1,
  })
  // Filter out pull requests (GitHub REST includes PRs in issues endpoint)
  const issues = data.filter((item) => !item.pull_request)
  return issues.map((issue) => mapIssue(issue, `${owner}/${repo}`))
}

export async function getIssue(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GHIssue> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  })
  return mapIssue(data, `${owner}/${repo}`)
}

export async function getIssueComments(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GHComment[]> {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  })
  return data.map(mapComment)
}

export async function getRepoLabels(owner: string, repo: string) {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.issues.listLabelsForRepo({
    owner,
    repo,
    per_page: 100,
  })
  return data.map((l) => ({ id: l.id, name: l.name, color: l.color }))
}

export async function getRepoMilestones(owner: string, repo: string) {
  const octokit = await getGithubClient()
  const { data } = await octokit.rest.issues.listMilestones({
    owner,
    repo,
    state: "open",
    per_page: 50,
  })
  return data.map((m) => ({
    number: m.number,
    title: m.title,
    dueOn: m.due_on ?? null,
    state: m.state as "open" | "closed",
  }))
}
