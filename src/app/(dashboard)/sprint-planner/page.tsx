import { Sparkles } from "lucide-react"
import { SprintPlannerForm } from "@/components/sprint/sprint-planner-form"

export default function SprintPlannerPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Sprint Planner
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select repositories, configure team capacity, and let AI assign your open issues into a sprint.
        </p>
      </div>

      <SprintPlannerForm />
    </div>
  )
}
