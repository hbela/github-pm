import { useQuery } from "@tanstack/react-query"
import type { GHIssue, IssueFilters } from "@/lib/github/types"

export function useIssues(owner: string, repo: string, filters: IssueFilters = {}) {
  const params = new URLSearchParams()
  if (filters.state) params.set("state", filters.state)
  if (filters.labels?.[0]) params.set("label", filters.labels[0])
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.page) params.set("page", String(filters.page))

  return useQuery<GHIssue[]>({
    queryKey: ["issues", owner, repo, filters],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/repos/${owner}/${repo}/issues?${params.toString()}`
      )
      if (!res.ok) throw new Error("Failed to fetch issues")
      return res.json()
    },
    enabled: Boolean(owner && repo),
  })
}
