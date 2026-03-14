"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { GHProjectField, GHProjectItem, KanbanColumn } from "@/lib/github/types"
import { useMoveItem } from "@/hooks/use-move-item"
import { DroppableColumn } from "./column"
import { DraggableCard } from "./card"

interface KanbanBoardProps {
  initialColumns: KanbanColumn[]
  statusField: GHProjectField
  projectId: string
}

export function KanbanBoard({ initialColumns, statusField, projectId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<GHProjectItem | null>(null)
  const moveItem = useMoveItem(projectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const item = columns.flatMap((c) => c.items).find((i) => i.id === event.active.id)
    setActiveItem(item ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const itemId = String(active.id)
    const targetColumnId = String(over.id)

    const sourceCol = columns.find((c) => c.items.some((i) => i.id === itemId))
    if (!sourceCol || sourceCol.optionId === targetColumnId) return

    // Snapshot for rollback
    const snapshot = columns

    // Optimistic update
    setColumns((prev) => {
      const movingItem = prev.flatMap((c) => c.items).find((i) => i.id === itemId)
      if (!movingItem) return prev
      return prev.map((col) => {
        if (col.optionId === sourceCol.optionId) {
          return { ...col, items: col.items.filter((i) => i.id !== itemId) }
        }
        if (col.optionId === targetColumnId) {
          return { ...col, items: [...col.items, { ...movingItem, statusOptionId: targetColumnId }] }
        }
        return col
      })
    })

    // Persist to GitHub
    moveItem.mutate(
      { itemId, fieldId: statusField.id, optionId: targetColumnId },
      { onError: () => setColumns(snapshot) }
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6">
        {columns.map((col) => (
          <DroppableColumn key={col.optionId} column={col} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeItem ? (
          <div className="rotate-1 shadow-xl w-72">
            <DraggableCard item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
