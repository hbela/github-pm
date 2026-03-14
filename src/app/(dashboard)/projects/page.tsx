import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink, Kanban } from "lucide-react"
import { getUserProjects } from "@/lib/github/graphql"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Your GitHub Projects v2 boards</p>
      </div>
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGrid />
      </Suspense>
    </div>
  )
}

async function ProjectsGrid() {
  const projects = await getUserProjects()

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Kanban className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No GitHub Projects found.</p>
        <p className="text-xs mt-1">
          Create a project at{" "}
          <a
            href="https://github.com/orgs/your-org/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            github.com
          </a>{" "}
          to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project.id} className="relative group border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
          {/* Full-card link — no nested <a> inside <a> */}
          <Link
            href={`/projects/${encodeURIComponent(project.id)}`}
            className="absolute inset-0 rounded-xl"
            aria-label={project.title}
          />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 relative z-10">
              <Kanban className="h-4 w-4 text-primary shrink-0" />
              <h2 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {project.title}
              </h2>
            </div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">Project #{project.number}</p>
        </div>
      ))}
    </div>
  )
}

function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
