import { NextResponse } from "next/server"
import { updateProjectItemStatus } from "@/lib/github/graphql"

interface RouteContext {
  params: Promise<{ projectId: string; itemId: string }>
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { projectId, itemId } = await params
  try {
    const { fieldId, optionId } = await req.json()
    if (!fieldId || !optionId) {
      return NextResponse.json({ error: "fieldId and optionId are required" }, { status: 400 })
    }
    await updateProjectItemStatus(projectId, itemId, fieldId, optionId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PATCH /api/github/projects/[projectId]/items/[itemId] error:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}
