import { AlertTriangle, CheckCircle2, User, Clock } from "lucide-react"
import type { SprintPlan } from "@/lib/ai/types"

interface SprintResultProps {
  plan: SprintPlan
}

export function SprintResult({ plan }: SprintResultProps) {
  const utilization = plan.totalCapacity > 0
    ? Math.round((plan.totalAllocated / plan.totalCapacity) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-muted/40 border text-sm">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{plan.totalAllocated}h</span>
          <span className="text-muted-foreground">/ {plan.totalCapacity}h capacity</span>
        </span>
        <div className="flex-1 min-w-[120px]">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                utilization > 100
                  ? "bg-destructive"
                  : utilization > 80
                  ? "bg-yellow-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
        <span
          className={`font-medium tabular-nums ${
            utilization > 100
              ? "text-destructive"
              : utilization > 80
              ? "text-yellow-600"
              : "text-emerald-600"
          }`}
        >
          {utilization}%
        </span>
      </div>

      {/* Per-assignee columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plan.sprint.map((assignment) => (
          <div key={assignment.assignee} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {assignment.assignee}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {assignment.totalHours}h
              </span>
            </div>

            {assignment.warning && (
              <div className="flex items-start gap-1.5 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b text-xs text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {assignment.warning}
              </div>
            )}

            <ul className="divide-y">
              {assignment.tasks.map((task) => (
                <li key={task.issueNumber} className="flex items-start justify-between gap-2 px-3 py-2 text-sm">
                  <span className="flex items-start gap-1.5 min-w-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="truncate" title={task.title}>
                      <span className="text-muted-foreground text-xs mr-1">#{task.issueNumber}</span>
                      {task.title}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                    {task.estimatedHours}h
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
