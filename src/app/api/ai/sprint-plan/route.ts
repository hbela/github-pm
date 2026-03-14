import { NextRequest, NextResponse } from "next/server"
import { getRepoIssues } from "@/lib/github/client"
import { getAnthropicClient } from "@/lib/ai/client"
import { buildSprintPlanPrompt } from "@/lib/ai/prompts"
import type { SprintPlan } from "@/lib/ai/types"

export async function POST(req: NextRequest) {
  try {
    const {
      repos,
      teamCapacity,
    }: {
      repos: { owner: string; repo: string }[]
      teamCapacity: { name: string; hours: number }[]
    } = await req.json()

    if (!repos?.length) {
      return NextResponse.json({ error: "Select at least one repository" }, { status: 400 })
    }
    if (!teamCapacity?.length || teamCapacity.some((m) => !m.name || m.hours <= 0)) {
      return NextResponse.json({ error: "Provide at least one team member with valid hours" }, { status: 400 })
    }

    // Fetch open issues from all selected repos in parallel
    const issuesByRepo = await Promise.all(
      repos.map(({ owner, repo }) =>
        getRepoIssues(owner, repo, { state: "open", perPage: 50 }).catch(() => [])
      )
    )
    const allIssues = issuesByRepo.flat()

    if (allIssues.length === 0) {
      return NextResponse.json({ error: "No open issues found in the selected repositories" }, { status: 400 })
    }

    const issueData = allIssues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      labels: issue.labels.map((l) => l.name),
      assignees: issue.assignees.map((a) => a.login),
      state: issue.state,
    }))

    const prompt = buildSprintPlanPrompt(issueData, teamCapacity)

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("")

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const plan: SprintPlan = JSON.parse(cleaned)

    return NextResponse.json(plan)
  } catch (err) {
    console.error("[sprint-plan]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate sprint plan" },
      { status: 500 }
    )
  }
}
