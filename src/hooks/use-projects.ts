import { useQuery } from "@tanstack/react-query"
import type { GHProject } from "@/lib/github/types"

export function useProjects() {
  return useQuery<GHProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/github/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })
}
