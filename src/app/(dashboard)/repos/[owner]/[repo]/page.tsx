import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft, ExternalLink, GitFork, Star, CircleDot } from "lucide-react"
import { getRepo, getRepoIssues, getRepoLabels, getRepoMilestones } from "@/lib/github/client"
import { IssueRow } from "@/components/issues/issue-row"
import { IssueFilters } from "@/components/issues/issue-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { IssueFilters as IssueFiltersType } from "@/lib/github/types"

interface PageProps {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ state?: string; label?: string; milestone?: string; sort?: string; page?: string }>
}

export default async function RepoIssuesPage({ params, searchParams }: PageProps) {
  const { owner, repo } = await params
  const sp = await searchParams

  const filters: IssueFiltersType = {
    state: (sp.state as "open" | "closed" | "all") ?? "open",
    labels: sp.label ? [sp.label] : undefined,
    milestone: sp.milestone,
    sort: (sp.sort as "created" | "updated" | "comments") ?? "updated",
    page: sp.page ? parseInt(sp.page) : 1,
  }

  return (
    <Suspense fallback={<IssueListSkeleton />}>
      <RepoIssuesContent owner={owner} repo={repo} filters={filters} />
    </Suspense>
  )
}

async function RepoIssuesContent({
  owner,
  repo,
  filters,
}: {
  owner: string
  repo: string
  filters: IssueFiltersType
}) {
  const [repoData, issues, labels, milestones] = await Promise.all([
    getRepo(owner, repo),
    getRepoIssues(owner, repo, filters),
    getRepoLabels(owner, repo),
    getRepoMilestones(owner, repo),
  ])

  const stateLabel =
    filters.state === "closed" ? "closed" : filters.state === "all" ? "all" : "open"

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 inline" /> Dashboard
        </Link>
      </div>

      {/* Repo header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{repoData.name}</h1>
            <Badge variant="outline" className="text-xs">
              {repoData.private ? "Private" : "Public"}
            </Badge>
            <a
              href={repoData.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          {repoData.description && (
            <p className="text-muted-foreground text-sm mt-1">{repoData.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> {repoData.stargazersCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" /> {repoData.forksCount}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CircleDot className="h-3.5 w-3.5" /> {repoData.openIssuesCount} open issues
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <IssueFilters labels={labels} milestones={milestones} />
        <span className="text-sm text-muted-foreground">
          {issues.length} {stateLabel} issues
        </span>
      </div>

      {/* Issue list */}
      <div className="border rounded-lg overflow-hidden">
        {issues.length > 0 ? (
          issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} owner={owner} repo={repo} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No {stateLabel} issues found.
          </div>
        )}
      </div>

      {/* Pagination hint */}
      {issues.length >= 30 && (
        <div className="flex justify-center">
          <Link
            href={`/repos/${owner}/${repo}?${new URLSearchParams({
              ...Object.fromEntries(
                Object.entries({ state: filters.state, sort: filters.sort }).filter(
                  ([, v]) => v !== undefined
                ) as [string, string][]
              ),
              page: String((filters.page ?? 1) + 1),
            })}`}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 h-7 text-sm hover:bg-muted transition-colors"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  )
}

function IssueListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>
      <div className="border rounded-lg overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-4 px-4 border-b last:border-b-0">
            <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
