import { NextResponse } from "next/server"
import { getUserProjects } from "@/lib/github/graphql"

export async function GET() {
  try {
    const projects = await getUserProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error("GET /api/github/projects error:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
