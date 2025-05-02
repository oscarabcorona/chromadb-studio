export function DocumentsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="h-10 w-80 bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="border rounded-md overflow-hidden">
        {/* Table header */}
        <div className="bg-muted p-4 border-b">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 h-6 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="col-span-3 h-6 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="col-span-2 h-6 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="col-span-2 h-6 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5 h-5 bg-muted animate-pulse rounded"></div>
              <div className="col-span-3 h-5 bg-muted animate-pulse rounded"></div>
              <div className="col-span-2 h-5 bg-muted animate-pulse rounded"></div>
              <div className="col-span-2 h-5 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
        <div className="flex space-x-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-muted rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
