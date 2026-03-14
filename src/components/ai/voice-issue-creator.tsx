"use client"

import { useState, useRef } from "react"
import { Mic, MicOff, Loader2, Sparkles, CheckCircle2, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ParsedIssue } from "@/lib/ai/types"

interface VoiceIssueCreatorProps {
  owner: string
  repo: string
}

type State =
  | { status: "idle" }
  | { status: "recording" }
  | { status: "processing"; transcript: string }
  | { status: "preview"; form: ParsedIssue; transcript: string }
  | { status: "creating"; form: ParsedIssue }
  | { status: "success"; number: number; htmlUrl: string; title: string }
  | { status: "error"; message: string }

// SpeechRecognition is not in TS lib — use any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export function VoiceIssueCreator({ owner, repo }: VoiceIssueCreatorProps) {
  const [state, setState] = useState<State>({ status: "idle" })
  const recognitionRef = useRef<AnySpeechRecognition>(null)

  function startRecording() {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState({ status: "error", message: "Speech recognition is not supported in this browser. Try Chrome or Edge." })
      return
    }

    const recognition: AnySpeechRecognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onresult = async (event: AnySpeechRecognition) => {
      const transcript: string = event.results[0][0].transcript
      setState({ status: "processing", transcript })
      await parseTranscript(transcript)
    }

    recognition.onerror = (event: AnySpeechRecognition) => {
      if (event.error === "no-speech") {
        setState({ status: "error", message: "No speech detected. Please try again." })
      } else if (event.error === "not-allowed") {
        setState({ status: "error", message: "Microphone access denied. Allow microphone permission and try again." })
      } else {
        setState({ status: "error", message: `Speech recognition error: ${event.error}` })
      }
    }

    recognition.onend = () => {
      // If still recording (no result yet), treat as no-speech
      setState((prev) => {
        if (prev.status === "recording") {
          return { status: "error", message: "No speech detected. Please try again." }
        }
        return prev
      })
    }

    setState({ status: "recording" })
    recognition.start()
  }

  function stopRecording() {
    recognitionRef.current?.stop()
  }

  async function parseTranscript(transcript: string) {
    try {
      const res = await fetch("/api/ai/voice-to-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      const json = await res.json()
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Failed to parse speech" })
        return
      }
      setState({ status: "preview", form: json, transcript })
    } catch {
      setState({ status: "error", message: "Failed to reach the server" })
    }
  }

  async function createIssue(form: ParsedIssue) {
    setState({ status: "creating", form })
    try {
      const assignees = form.assignee ? [form.assignee] : []
      const res = await fetch(`/api/github/repos/${owner}/${repo}/issues/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.description,
          assignees,
          labels: form.labels,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Failed to create issue" })
        return
      }
      setState({ status: "success", number: json.number, htmlUrl: json.htmlUrl, title: json.title })
    } catch {
      setState({ status: "error", message: "Failed to reach the server" })
    }
  }

  function reset() {
    setState({ status: "idle" })
  }

  // --- idle ---
  if (state.status === "idle") {
    return (
      <Button variant="outline" size="sm" onClick={startRecording}>
        <Mic className="h-3.5 w-3.5" />
        Voice Issue
      </Button>
    )
  }

  // --- recording ---
  if (state.status === "recording") {
    return (
      <Button variant="destructive" size="sm" onClick={stopRecording}>
        <MicOff className="h-3.5 w-3.5 animate-pulse" />
        Recording… click to stop
      </Button>
    )
  }

  // --- processing ---
  if (state.status === "processing") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Analyzing…
      </Button>
    )
  }

  // --- success ---
  if (state.status === "success") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <span>
          Issue{" "}
          <a
            href={state.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline inline-flex items-center gap-0.5"
          >
            #{state.number} <ExternalLink className="h-3 w-3" />
          </a>{" "}
          created
        </span>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // --- error ---
  if (state.status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-destructive">{state.message}</span>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    )
  }

  // --- preview form (state.status === "preview" | "creating") ---
  const form = state.status === "preview" ? state.form : state.form
  const isCreating = state.status === "creating"

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          New Issue from Voice
        </span>
        <button
          onClick={reset}
          disabled={isCreating}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.status === "preview" && (
        <p className="text-xs text-muted-foreground italic">
          "{state.transcript}"
        </p>
      )}

      <div className="space-y-2">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</span>
          <input
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.title}
            onChange={(e) =>
              state.status === "preview" &&
              setState({ ...state, form: { ...form, title: e.target.value } })
            }
            disabled={isCreating}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
            value={form.description}
            onChange={(e) =>
              state.status === "preview" &&
              setState({ ...state, form: { ...form, description: e.target.value } })
            }
            disabled={isCreating}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignee</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.assignee ?? ""}
              placeholder="github username"
              onChange={(e) =>
                state.status === "preview" &&
                setState({ ...state, form: { ...form, assignee: e.target.value || null } })
              }
              disabled={isCreating}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.labels.join(", ")}
              placeholder="bug, feature, ..."
              onChange={(e) =>
                state.status === "preview" &&
                setState({
                  ...state,
                  form: {
                    ...form,
                    labels: e.target.value
                      .split(",")
                      .map((l) => l.trim())
                      .filter(Boolean),
                  },
                })
              }
              disabled={isCreating}
            />
          </label>
        </div>

        {form.priority && (
          <p className="text-xs text-muted-foreground">
            Priority detected: <span className="font-medium capitalize">{form.priority}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => createIssue(form)}
          disabled={isCreating || !form.title.trim()}
        >
          {isCreating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</>
          ) : (
            "Create Issue"
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={reset} disabled={isCreating}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
