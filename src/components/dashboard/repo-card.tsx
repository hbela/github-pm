import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Star, GitFork, CircleDot, Lock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GHRepo } from "@/lib/github/types"

interface RepoCardProps {
  repo: GHRepo
}

export function RepoCard({ repo }: RepoCardProps) {
  const [owner, name] = repo.fullName.split("/")

  return (
    <Link href={`/repos/${owner}/${name}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {repo.private && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              <span className="font-semibold text-sm truncate">{repo.name}</span>
            </div>
            {repo.language && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {repo.language}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {repo.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {repo.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {repo.stargazersCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" />
              {repo.forksCount}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CircleDot className="h-3.5 w-3.5" />
              {repo.openIssuesCount} issues
            </span>
            <span className="ml-auto">
              {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
