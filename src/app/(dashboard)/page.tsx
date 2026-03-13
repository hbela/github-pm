import { Suspense } from "react"
import { getAuthenticatedUser, getUserRepos } from "@/lib/github/client"
import { RepoCard } from "@/components/dashboard/repo-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, CircleDot, GitFork, Star } from "lucide-react"

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const [user, repos] = await Promise.all([
    getAuthenticatedUser(),
    getUserRepos(),
  ])

  const totalStars = repos.reduce((sum, r) => sum + r.stargazersCount, 0)
  const totalOpenIssues = repos.reduce((sum, r) => sum + r.openIssuesCount, 0)
  const totalForks = repos.reduce((sum, r) => sum + r.forksCount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name ?? user.login}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your GitHub projects
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Repositories"
          value={repos.length}
          description="Total repos"
          icon={BookOpen}
        />
        <StatsCard
          title="Open Issues"
          value={totalOpenIssues}
          description="Across all repos"
          icon={CircleDot}
        />
        <StatsCard
          title="Total Stars"
          value={totalStars}
          description="Combined stars"
          icon={Star}
        />
        <StatsCard
          title="Total Forks"
          value={totalForks}
          description="Combined forks"
          icon={GitFork}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your Repositories</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
        {repos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No repositories found.
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  )
}
