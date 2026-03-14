import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft, ExternalLink } from "lucide-react"
import { getProjectBoard } from "@/lib/github/graphql"
import { KanbanBoard } from "@/components/kanban/board"
import { BoardSkeleton } from "@/components/kanban/board-skeleton"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectBoardPage({ params }: PageProps) {
  const { projectId } = await params
  const decodedId = decodeURIComponent(projectId)

  return (
    <Suspense fallback={<BoardPageSkeleton />}>
      <BoardContent projectId={decodedId} />
    </Suspense>
  )
}

async function BoardContent({ projectId }: { projectId: string }) {
  const { project, statusField, columns } = await getProjectBoard(projectId)

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Projects
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Board */}
      {!statusField ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          This project has no Status field. Add a single-select field named &quot;Status&quot; to use the
          Kanban board.
        </div>
      ) : (
        <KanbanBoard
          initialColumns={columns}
          statusField={statusField}
          projectId={projectId}
        />
      )}
    </div>
  )
}

function BoardPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-24 bg-muted rounded animate-pulse" />
      <div className="h-8 w-64 bg-muted rounded animate-pulse" />
      <BoardSkeleton />
    </div>
  )
}
