import { NextResponse } from "next/server"
import { getProjectBoard } from "@/lib/github/graphql"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { projectId } = await params
  try {
    const board = await getProjectBoard(projectId)
    return NextResponse.json(board)
  } catch (error) {
    console.error("GET /api/github/projects/[projectId]/board error:", error)
    return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 })
  }
}
