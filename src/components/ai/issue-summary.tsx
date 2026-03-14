"use client"

import { useState } from "react"
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IssueSummary } from "@/lib/ai/types"

interface IssueSummaryProps {
  owner: string
  repo: string
  number: number
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: IssueSummary }
  | { status: "error"; message: string }

export function IssueSummary({ owner, repo, number }: IssueSummaryProps) {
  const [state, setState] = useState<State>({ status: "idle" })
  const [expanded, setExpanded] = useState(true)

  async function summarize() {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/ai/summarize-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, number }),
      })
      const json = await res.json()
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Unknown error" })
        return
      }
      setState({ status: "success", data: json })
    } catch {
      setState({ status: "error", message: "Failed to reach the server" })
    }
  }

  if (state.status === "idle") {
    return (
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={summarize}>
          <Sparkles className="h-3.5 w-3.5" />
          Summarize with AI
        </Button>
      </div>
    )
  }

  if (state.status === "loading") {
    return (
      <div className="mt-4">
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analyzing…
        </Button>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="mt-4 flex items-center gap-3">
        <p className="text-sm text-destructive">{state.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState({ status: "idle" })}
        >
          Try again
        </Button>
      </div>
    )
  }

  const { summary, decisions, actionItems } = state.data

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          AI Summary
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-3 text-sm">
          <p className="text-foreground">{summary}</p>

          {decisions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Key Decisions
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {decisions.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Action Items
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {actionItems.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 text-blue-500">→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setState({ status: "idle" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}
