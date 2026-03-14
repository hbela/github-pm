import { Skeleton } from "@/components/ui/skeleton"

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div key={colIdx} className="flex flex-col w-72 shrink-0 bg-muted/40 rounded-xl p-3 border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 ml-auto rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, cardIdx) => (
              <div key={cardIdx} className="bg-card border rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
