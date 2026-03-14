import { useMutation } from "@tanstack/react-query"
import type { SprintPlan } from "@/lib/ai/types"

export interface SprintPlanInput {
  repos: { owner: string; repo: string }[]
  teamCapacity: { name: string; hours: number }[]
}

export function useSprintPlan() {
  return useMutation<SprintPlan, Error, SprintPlanInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to generate sprint plan")
      return json
    },
  })
}
