"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface IssueFiltersProps {
  labels?: { id: number; name: string; color: string }[]
  milestones?: { number: number; title: string }[]
}

export function IssueFilters({ labels = [], milestones = [] }: IssueFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "all") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      params.delete("page")
      return params.toString()
    },
    [searchParams]
  )

  const currentState = searchParams.get("state") ?? "open"
  const currentLabel = searchParams.get("label") ?? "all"
  const currentMilestone = searchParams.get("milestone") ?? "all"
  const currentSort = searchParams.get("sort") ?? "updated"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentState}
        onValueChange={(val) =>
          router.push(`${pathname}?${createQueryString({ state: val })}`)
        }
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {labels.length > 0 && (
        <Select
          value={currentLabel}
          onValueChange={(val) =>
            router.push(`${pathname}?${createQueryString({ label: val })}`)
          }
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All labels</SelectItem>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.name}>
                {label.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {milestones.length > 0 && (
        <Select
          value={currentMilestone}
          onValueChange={(val) =>
            router.push(`${pathname}?${createQueryString({ milestone: val })}`)
          }
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Milestone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All milestones</SelectItem>
            {milestones.map((m) => (
              <SelectItem key={m.number} value={String(m.number)}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={currentSort}
        onValueChange={(val) =>
          router.push(`${pathname}?${createQueryString({ sort: val })}`)
        }
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Recently updated</SelectItem>
          <SelectItem value="created">Newest</SelectItem>
          <SelectItem value="comments">Most commented</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
