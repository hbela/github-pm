import { useMutation } from "@tanstack/react-query"

interface MoveItemPayload {
  itemId: string
  fieldId: string
  optionId: string
}

export function useMoveItem(projectId: string) {
  return useMutation({
    mutationFn: async ({ itemId, fieldId, optionId }: MoveItemPayload) => {
      const res = await fetch(`/api/github/projects/${projectId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId, optionId }),
      })
      if (!res.ok) throw new Error("Failed to move item")
    },
  })
}
