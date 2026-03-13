import { NextResponse } from "next/server"
import { getUserRepos } from "@/lib/github/client"

export async function GET() {
  try {
    const repos = await getUserRepos()
    return NextResponse.json(repos)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
