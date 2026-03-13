import { NextResponse } from "next/server"
import { getRepoIssues } from "@/lib/github/client"
import type { IssueFilters } from "@/lib/github/types"

interface Params {
  params: Promise<{ owner: string; repo: string }>
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { owner, repo } = await params
    const url = new URL(request.url)
    const sp = url.searchParams

    const filters: IssueFilters = {
      state: (sp.get("state") as "open" | "closed" | "all") ?? "open",
      labels: sp.get("label") ? [sp.get("label")!] : undefined,
      sort: (sp.get("sort") as "created" | "updated" | "comments") ?? "updated",
      page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    }

    const issues = await getRepoIssues(owner, repo, filters)
    return NextResponse.json(issues)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
