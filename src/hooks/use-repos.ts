import { useQuery } from "@tanstack/react-query"
import type { GHRepo } from "@/lib/github/types"

export function useRepos() {
  return useQuery<GHRepo[]>({
    queryKey: ["repos"],
    queryFn: async () => {
      const res = await fetch("/api/github/repos")
      if (!res.ok) throw new Error("Failed to fetch repos")
      return res.json()
    },
  })
}
