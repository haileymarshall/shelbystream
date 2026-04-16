import { Skeleton } from "@/components/ui/skeleton";

export default function VideoSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      <Skeleton className="aspect-video w-full bg-surface" />
      <div className="p-3 flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-surface" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-3.5 w-full bg-surface" />
          <Skeleton className="h-3.5 w-3/4 bg-surface" />
          <Skeleton className="h-3 w-1/2 bg-surface" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoSkeleton key={i} />
      ))}
    </div>
  );
}
