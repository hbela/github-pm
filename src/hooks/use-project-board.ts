import { useQuery } from "@tanstack/react-query"
import type { GHProject, GHProjectField, KanbanColumn } from "@/lib/github/types"

export interface ProjectBoard {
  project: GHProject
  statusField: GHProjectField | null
  columns: KanbanColumn[]
}

export function useProjectBoard(projectId: string) {
  return useQuery<ProjectBoard>({
    queryKey: ["project-board", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/github/projects/${projectId}/board`)
      if (!res.ok) throw new Error("Failed to fetch board")
      return res.json()
    },
    enabled: Boolean(projectId),
  })
}
