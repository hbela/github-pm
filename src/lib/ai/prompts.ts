import type { GHComment, GHIssue } from "@/lib/github/types"

export function buildVoiceToIssuePrompt(transcript: string): string {
  return `You are a software project manager. Convert the following spoken instruction into a structured GitHub issue.

Spoken instruction:
"${transcript}"

Return ONLY a valid JSON object with this exact shape — no markdown, no explanation:
{
  "title": "short imperative title for the GitHub issue",
  "description": "detailed description in markdown",
  "assignee": "github username if mentioned, or null",
  "labels": ["label1", "label2"],
  "priority": "high" | "medium" | "low" | null
}

Rules:
- title: concise, imperative (e.g. "Fix login bug", "Add dark mode toggle")
- description: expand the spoken instruction into a proper issue body with context
- assignee: only if a name/username was explicitly mentioned, otherwise null
- labels: infer relevant labels (e.g. "bug", "feature", "enhancement", "documentation") — empty array if none fit
- priority: infer from keywords like "urgent/critical/asap" → high, "soon/next" → medium, "eventually/someday" → low, otherwise null`
}

export function buildSprintPlanPrompt(
  issues: Array<{
    number: number
    title: string
    labels: string[]
    assignees: string[]
    state: string
  }>,
  teamCapacity: Array<{ name: string; hours: number }>
): string {
  const issueList = issues
    .map(
      (i) =>
        `#${i.number}: ${i.title}` +
        (i.labels.length ? ` [${i.labels.join(", ")}]` : "") +
        (i.assignees.length ? ` (assigned: ${i.assignees.join(", ")})` : "")
    )
    .join("\n")

  const teamList = teamCapacity.map((m) => `${m.name}: ${m.hours}h`).join("\n")

  return `You are an experienced agile project manager. Create a sprint plan from the open issues below.

Team capacity:
${teamList}

Open issues:
${issueList}

Rules:
- Assign each issue to exactly one team member
- Respect each member's hour capacity — do not exceed it
- Prefer existing assignees when already set on an issue
- Estimate hours per task based on typical software complexity (bugs: 1-4h, features: 3-12h, docs: 1-3h)
- If a member would be overloaded, set a warning string explaining which tasks could not fit
- totalCapacity = sum of all team hours
- totalAllocated = sum of all assigned task hours

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "sprint": [
    {
      "assignee": "name",
      "tasks": [{ "title": "...", "issueNumber": 0, "estimatedHours": 0 }],
      "totalHours": 0,
      "warning": null
    }
  ],
  "totalCapacity": 0,
  "totalAllocated": 0
}`
}

export function buildSummaryPrompt(issue: GHIssue, comments: GHComment[]): string {
  const commentThread = comments
    .map(
      (c, i) =>
        `Comment ${i + 1} by @${c.author.login}:\n${c.body}`
    )
    .join("\n\n")

  return `You are a software project manager. Analyze the following GitHub issue and its comments, then return a JSON object summarizing the discussion.

Issue: #${issue.number} — ${issue.title}
Author: @${issue.author.login}
State: ${issue.state}

Issue body:
${issue.body ?? "(no description)"}

${comments.length > 0 ? `Comments:\n${commentThread}` : "(no comments yet)"}

Return ONLY a valid JSON object with this exact shape — no markdown, no explanation:
{
  "summary": "1-2 sentence overview of what this issue is about and its current status",
  "decisions": ["decision or conclusion reached in the discussion"],
  "actionItems": ["concrete next step or task mentioned"]
}

Rules:
- summary must be ≤ 2 sentences
- decisions: list only conclusions that were actually agreed upon — omit if none
- actionItems: list only concrete tasks or next steps — omit if none
- both arrays may be empty []`
}
