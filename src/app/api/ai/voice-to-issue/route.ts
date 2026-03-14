import { NextRequest, NextResponse } from "next/server"
import { getAnthropicClient } from "@/lib/ai/client"
import { buildVoiceToIssuePrompt } from "@/lib/ai/prompts"
import type { ParsedIssue } from "@/lib/ai/types"

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 })
    }

    const prompt = buildVoiceToIssuePrompt(transcript)

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
    const parsed: ParsedIssue = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[voice-to-issue]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse voice input" },
      { status: 500 }
    )
  }
}
