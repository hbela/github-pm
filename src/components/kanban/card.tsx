"use client"

import Link from "next/link"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MessageSquare } from "lucide-react"
import type { GHProjectItem } from "@/lib/github/types"

interface DraggableCardProps {
  item: GHProjectItem
}

export function DraggableCard({ item }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  const { issue } = item
  const issueDetailUrl = `/repos/${issue.repoFullName}/issues/${issue.number}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow select-none"
    >
      <div className="flex items-start gap-1.5 mb-2">
        <button
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Drag to move"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Link
          href={issueDetailUrl}
          className="text-sm font-medium line-clamp-2 leading-snug hover:text-primary transition-colors"
        >
          {issue.title}
        </Link>
      </div>

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `#${label.color}22`,
                color: `#${label.color}`,
                border: `1px solid #${label.color}44`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
        <span className="tabular-nums">#{issue.number}</span>
        <div className="flex items-center gap-2">
          {issue.commentsCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {issue.commentsCount}
            </span>
          )}
          {issue.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {issue.assignees.slice(0, 2).map((assignee) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={assignee.login}
                  src={assignee.avatarUrl}
                  alt={assignee.login}
                  title={assignee.login}
                  className="h-4 w-4 rounded-full border border-background"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
