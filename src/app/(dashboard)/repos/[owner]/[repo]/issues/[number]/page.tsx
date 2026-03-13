import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ChevronLeft,
  CircleDot,
  CheckCircle2,
  User,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { getIssue, getIssueComments } from "@/lib/github/client"
import { CommentList } from "@/components/issues/comment-list"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  params: Promise<{ owner: string; repo: string; number: string }>
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { owner, repo, number } = await params

  return (
    <Suspense fallback={<IssueDetailSkeleton />}>
      <IssueDetailContent owner={owner} repo={repo} issueNumber={parseInt(number)} />
    </Suspense>
  )
}

async function IssueDetailContent({
  owner,
  repo,
  issueNumber,
}: {
  owner: string
  repo: string
  issueNumber: number
}) {
  if (isNaN(issueNumber)) {
    notFound()
  }

  const [issue, comments] = await Promise.all([
    getIssue(owner, repo, issueNumber).catch(() => null),
    getIssueComments(owner, repo, issueNumber).catch(() => []),
  ])

  if (!issue) {
    notFound()
  }

  const isOpen = issue.state === "open"

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/repos/${owner}/${repo}`}
          className="hover:text-foreground transition-colors"
        >
          {owner}/{repo}
        </Link>
        <span>/</span>
        <span className="text-foreground">Issue #{issue.number}</span>
      </div>

      {/* Issue header */}
      <div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isOpen ? (
              <CircleDot className="h-6 w-6 text-emerald-600" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              {issue.title}
              <span className="ml-2 font-normal text-muted-foreground">
                #{issue.number}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Open" : "Closed"}
              </Badge>
              <span>
                <span className="font-medium text-foreground">{issue.author.login}</span>{" "}
                opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
              </span>
              {issue.commentsCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {issue.commentsCount} comments
                </span>
              )}
              <a
                href={issue.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Issue body */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b">
              <Avatar className="h-6 w-6">
                <AvatarImage src={issue.author.avatarUrl} alt={issue.author.login} />
                <AvatarFallback>{issue.author.login[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm">
                <span className="font-medium">{issue.author.login}</span>{" "}
                <span className="text-muted-foreground">
                  commented {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </span>
              </span>
            </div>
            <div className="p-4">
              {issue.body ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {issue.body}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </span>
                <Separator className="flex-1" />
              </div>
              <CommentList comments={comments} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Labels */}
          {issue.labels.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Labels
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assignees */}
          {issue.assignees.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Assignees
              </h3>
              <div className="space-y-2">
                {issue.assignees.map((assignee) => (
                  <a
                    key={assignee.login}
                    href={assignee.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignee.avatarUrl} alt={assignee.login} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignee.login}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Milestone */}
          {issue.milestone && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Milestone
              </h3>
              <div className="text-sm">
                <span>🎯 {issue.milestone.title}</span>
                {issue.milestone.dueOn && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due {formatDistanceToNow(new Date(issue.milestone.dueOn), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Timeline
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Created{" "}
                {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
              </p>
              <p>
                Updated{" "}
                {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
              </p>
              {issue.closedAt && (
                <p>
                  Closed{" "}
                  {formatDistanceToNow(new Date(issue.closedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IssueDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <Skeleton className="h-4 w-64" />
      <div className="flex gap-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-full max-w-lg" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-16" />
        </div>
      </div>
    </div>
  )
}
