import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { GHComment } from "@/lib/github/types"

interface CommentListProps {
  comments: GHComment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No comments yet.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.author.avatarUrl} alt={comment.author.login} />
              <AvatarFallback>{comment.author.login[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author.login}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 bg-muted/20">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {comment.body}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          {index < comments.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  )
}
