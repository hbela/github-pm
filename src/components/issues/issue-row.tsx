import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CircleDot, CheckCircle2, MessageSquare, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GHIssue } from "@/lib/github/types"

interface IssueRowProps {
  issue: GHIssue
  owner: string
  repo: string
}

export function IssueRow({ issue, owner, repo }: IssueRowProps) {
  return (
    <div className="flex items-start gap-3 py-4 px-4 hover:bg-muted/30 transition-colors border-b last:border-b-0">
      <div className="mt-0.5 flex-shrink-0">
        {issue.state === "open" ? (
          <CircleDot className="h-5 w-5 text-emerald-600" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-purple-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/repos/${owner}/${repo}/issues/${issue.number}`}
            className="font-medium hover:text-primary transition-colors truncate"
          >
            {issue.title}
          </Link>
          {issue.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="text-xs px-1.5 py-0"
              style={{
                borderColor: `#${label.color}`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>#{issue.number}</span>
          <span>
            opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })} by{" "}
            <span className="font-medium">{issue.author.login}</span>
          </span>
          {issue.milestone && (
            <span className="flex items-center gap-1">
              🎯 {issue.milestone.title}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {issue.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {issue.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.login} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.avatarUrl} alt={assignee.login} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        {issue.commentsCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {issue.commentsCount}
          </span>
        )}
      </div>
    </div>
  )
}
