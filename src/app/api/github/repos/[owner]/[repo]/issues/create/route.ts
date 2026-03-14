import { NextRequest, NextResponse } from "next/server"
import { createIssue } from "@/lib/github/client"

interface RouteParams {
  params: Promise<{ owner: string; repo: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { owner, repo } = await params
    const { title, body, assignees, labels } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const issue = await createIssue(owner, repo, { title, body, assignees, labels })
    return NextResponse.json(issue, { status: 201 })
  } catch (err) {
    console.error("[issues/create]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create issue" },
      { status: 500 }
    )
  }
}
