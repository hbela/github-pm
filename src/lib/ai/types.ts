// --- Phase 3.1: AI Issue Summarizer ---

export interface IssueSummary {
  summary: string
  decisions: string[]
  actionItems: string[]
}

// --- Phase 3.2: Voice-to-Issue (future) ---

export interface ParsedIssue {
  title: string
  description: string
  assignee: string | null
  labels: string[]
  priority: "high" | "medium" | "low" | null
}

// --- Phase 3.3: Sprint Planner (future) ---

export interface SprintAssignment {
  assignee: string
  tasks: { title: string; issueNumber: number; estimatedHours: number }[]
  totalHours: number
  warning?: string
}

export interface SprintPlan {
  sprint: SprintAssignment[]
  totalCapacity: number
  totalAllocated: number
}
