"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { KanbanColumn } from "@/lib/github/types"
import { DraggableCard } from "./card"

interface DroppableColumnProps {
  column: KanbanColumn
}

// Maps GitHub's color names to hex values
const COLOR_MAP: Record<string, string> = {
  RED: "#ef4444",
  ORANGE: "#f97316",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
  BLUE: "#3b82f6",
  PURPLE: "#a855f7",
  PINK: "#ec4899",
  GRAY: "#6b7280",
  TEAL: "#14b8a6",
  INDIGO: "#6366f1",
}

export function DroppableColumn({ column }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.optionId })

  const accentColor = COLOR_MAP[column.color] ?? "#6b7280"

  return (
    <div className="flex flex-col w-72 shrink-0 bg-muted/40 rounded-xl p-3 border">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
        <h3 className="font-semibold text-sm flex-1 truncate">{column.name}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
          {column.items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[80px] rounded-lg p-1 transition-colors",
          isOver && "bg-primary/5 ring-1 ring-primary/20"
        )}
      >
        {column.items.map((item) => (
          <DraggableCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
