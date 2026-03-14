"use client"

import { useState } from "react"
import { Plus, Trash2, Loader2, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRepos } from "@/hooks/use-repos"
import { useSprintPlan } from "@/hooks/use-sprint-plan"
import { SprintResult } from "@/components/sprint/sprint-result"

interface TeamMember {
  name: string
  hours: number
}

export function SprintPlannerForm() {
  const { data: repos, isLoading: reposLoading } = useRepos()
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [team, setTeam] = useState<TeamMember[]>([{ name: "", hours: 20 }])
  const { mutate, data: plan, isPending, error, reset } = useSprintPlan()

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) => {
      const next = new Set(prev)
      if (next.has(fullName)) next.delete(fullName)
      else next.add(fullName)
      return next
    })
  }

  function addMember() {
    setTeam((prev) => [...prev, { name: "", hours: 20 }])
  }

  function removeMember(i: number) {
    setTeam((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateMember(i: number, field: keyof TeamMember, value: string | number) {
    setTeam((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)))
  }

  function generate() {
    const repos = [...selectedRepos].map((full) => {
      const [owner, repo] = full.split("/")
      return { owner, repo }
    })
    const teamCapacity = team.filter((m) => m.name.trim() && m.hours > 0)
    mutate({ repos, teamCapacity })
  }

  const canGenerate =
    selectedRepos.size > 0 &&
    team.some((m) => m.name.trim() && m.hours > 0) &&
    !isPending

  if (plan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Sprint Plan
          </h2>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            New Plan
          </Button>
        </div>
        <SprintResult plan={plan} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Repo selection */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Repositories
        </h2>
        {reposLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading repositories…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {repos?.map((repo) => {
              const selected = selectedRepos.has(repo.fullName)
              return (
                <label
                  key={repo.fullName}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={selected}
                    onChange={() => toggleRepo(repo.fullName)}
                  />
                  <span className="truncate font-medium">{repo.name}</span>
                  {repo.openIssuesCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                      {repo.openIssuesCount} open
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Team capacity */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Team Capacity
        </h2>
        <div className="space-y-2">
          {team.map((member, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Team member name or GitHub username"
                value={member.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="number"
                  min={1}
                  max={200}
                  className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  value={member.hours}
                  onChange={(e) => updateMember(i, "hours", parseInt(e.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
              {team.length > 1 && (
                <button
                  onClick={() => removeMember(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addMember} className="mt-1">
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}

      {/* Submit */}
      <Button onClick={generate} disabled={!canGenerate}>
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating Sprint Plan…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate Sprint Plan</>
        )}
      </Button>
    </div>
  )
}
