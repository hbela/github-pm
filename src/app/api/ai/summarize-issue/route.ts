import { NextRequest, NextResponse } from "next/server"
import { getIssue, getIssueComments } from "@/lib/github/client"
import { getAnthropicClient } from "@/lib/ai/client"
import { buildSummaryPrompt } from "@/lib/ai/prompts"
import type { IssueSummary } from "@/lib/ai/types"

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, number } = await req.json()

    if (!owner || !repo || typeof number !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [issue, comments] = await Promise.all([
      getIssue(owner, repo, number),
      getIssueComments(owner, repo, number),
    ])

    const prompt = buildSummaryPrompt(issue, comments)

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("")

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const summary: IssueSummary = JSON.parse(cleaned)

    return NextResponse.json(summary)
  } catch (err) {
    console.error("[summarize-issue]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to summarize issue" },
      { status: 500 }
    )
  }
}
