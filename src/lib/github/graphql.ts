import { graphql } from "@octokit/graphql"
import { auth } from "@/auth"
import type {
  GHProject,
  GHProjectField,
  GHProjectItem,
  KanbanColumn,
  GHIssue,
  GHLabel,
  GHUser,
  GHMilestone,
} from "./types"

async function getGraphQLClient() {
  const session = await auth()
  if (!session?.accessToken) throw new Error("Not authenticated")
  return graphql.defaults({
    headers: { authorization: `token ${session.accessToken}` },
  })
}

// --- Private GraphQL mappers (GitHub returns camelCase, not snake_case) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGQLUser(raw: any): GHUser {
  return {
    login: raw.login,
    avatarUrl: raw.avatarUrl,
    htmlUrl: raw.url ?? "",
    name: raw.name ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGQLLabel(raw: any): GHLabel {
  return {
    id: raw.id,  // GraphQL node ID (string) — matches GHLabel.id: string
    name: raw.name,
    color: raw.color,
    description: raw.description ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGQLMilestone(raw: any): GHMilestone | null {
  if (!raw) return null
  return {
    number: raw.number,
    title: raw.title,
    dueOn: raw.dueOn ?? null,
    state: (raw.state as string).toLowerCase() as "open" | "closed",
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGQLIssue(raw: any): GHIssue {
  return {
    id: raw.databaseId ?? 0,
    number: raw.number,
    title: raw.title,
    body: raw.body ?? null,
    state: (raw.state as string).toLowerCase() as "open" | "closed",
    labels: (raw.labels?.nodes ?? []).map(mapGQLLabel),
    assignees: (raw.assignees?.nodes ?? []).map(mapGQLUser),
    milestone: mapGQLMilestone(raw.milestone),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    closedAt: raw.closedAt ?? null,
    htmlUrl: raw.url ?? "",
    author: raw.author ? mapGQLUser(raw.author) : { login: "ghost", avatarUrl: "", htmlUrl: "" },
    commentsCount: raw.comments?.totalCount ?? 0,
    repoFullName: raw.repository?.nameWithOwner ?? "",
  }
}

// --- Public API functions ---

export async function getUserProjects(): Promise<GHProject[]> {
  const gql = await getGraphQLClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await gql(`
    query {
      viewer {
        projectsV2(first: 20) {
          nodes {
            id
            number
            title
            url
          }
        }
      }
    }
  `)
  return (result.viewer.projectsV2.nodes ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any): GHProject => ({
      id: p.id,
      number: p.number,
      title: p.title,
      url: p.url,
    })
  )
}

export async function getProjectBoard(projectId: string): Promise<{
  project: GHProject
  statusField: GHProjectField | null
  columns: KanbanColumn[]
}> {
  const gql = await getGraphQLClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await gql(
    `
    query GetProjectBoard($id: ID!) {
      node(id: $id) {
        ... on ProjectV2 {
          id
          number
          title
          url
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name color }
              }
            }
          }
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  databaseId
                  number
                  title
                  body
                  state
                  url
                  author { login avatarUrl url }
                  labels(first: 10) { nodes { id name color description } }
                  assignees(first: 5) { nodes { login avatarUrl url } }
                  milestone { number title dueOn state }
                  comments { totalCount }
                  repository { nameWithOwner }
                  createdAt
                  updatedAt
                  closedAt
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    optionId
                    field {
                      ... on ProjectV2SingleSelectField { name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
    { id: projectId }
  )

  const node = result.node

  const project: GHProject = {
    id: node.id,
    number: node.number,
    title: node.title,
    url: node.url,
  }

  // Prefer a field named "Status"; fall back to first single-select field with options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFields: any[] = node.fields?.nodes ?? []
  const statusField: GHProjectField | null =
    allFields.find((f) => f?.options?.length > 0 && f?.name === "Status") ??
    allFields.find((f) => f?.options?.length > 0) ??
    null

  if (!statusField) {
    return { project, statusField: null, columns: [] }
  }

  // Build column buckets from status field options
  const columns: KanbanColumn[] = statusField.options.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opt: any): KanbanColumn => ({
      optionId: opt.id,
      name: opt.name,
      color: opt.color,
      items: [],
    })
  )

  const unassignedColumn: KanbanColumn = {
    optionId: "unassigned",
    name: "No Status",
    color: "GRAY",
    items: [],
  }

  // Distribute items into columns
  for (const item of node.items?.nodes ?? []) {
    if (!item.content?.databaseId) continue // skip drafts / PRs

    const issue = mapGQLIssue(item.content)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusValue = (item.fieldValues?.nodes ?? []).find((fv: any) => fv?.optionId !== undefined)
    const optionId: string | null = statusValue?.optionId ?? null

    const projectItem: GHProjectItem = { id: item.id, issue, statusOptionId: optionId }

    const col = columns.find((c) => c.optionId === optionId)
    if (col) {
      col.items.push(projectItem)
    } else {
      unassignedColumn.items.push(projectItem)
    }
  }

  if (unassignedColumn.items.length > 0) {
    columns.unshift(unassignedColumn)
  }

  return { project, statusField, columns }
}

export async function updateProjectItemStatus(
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string
): Promise<void> {
  const gql = await getGraphQLClient()
  await gql(
    `
    mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item { id }
      }
    }
  `,
    { projectId, itemId, fieldId, optionId }
  )
}
