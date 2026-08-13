"use client"
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="space-y-8">
    <div className="w-full flex items-end  justify-end opacity-100">
    <Skeleton className="h-10 w-[42%] rounded-2xl" />
    </div>
    <div className="flex items-start gap-4 justify-start opacity-60">
      {/* Assistant avatar */}
      <Avatar  className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900  shadow-sm text-xs">
        GAI
      </Avatar>

      {/* Message content */}
      <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
        <div className="space-y-3">
          <Skeleton className="h-2 w-[92%] rounded-md" />
          <Skeleton className="h-2 w-[78%] rounded-md" />
          <Skeleton className="h-2 w-[86%] rounded-md" />
          <Skeleton className="h-2 w-[45%] rounded-md" />
           <Skeleton className="h-2 w-[92%] rounded-md" />
          <Skeleton className="h-2 w-[78%] rounded-md" />
          <Skeleton className="h-2 w-[86%] rounded-md" />
          <Skeleton className="h-2 w-[45%] rounded-md" />
        </div>
      </div>
    </div>

    <div className="w-full flex items-end  justify-end opacity-40">
    <Skeleton className="h-8 w-[62%] rounded-2xl" />
    </div>
    <div className="flex items-start gap-4 justify-start opacity-20">
      {/* Assistant avatar */}
      <Avatar  className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900  shadow-sm text-xs">
        GAI
      </Avatar>

      {/* Message content */}
      <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
        <div className="space-y-3">
          <Skeleton className="h-2 w-[92%] rounded-md" />
          <Skeleton className="h-2 w-[78%] rounded-md" />
          <Skeleton className="h-2 w-[86%] rounded-md" />
          <Skeleton className="h-2 w-[45%] rounded-md" />
           <Skeleton className="h-2 w-[92%] rounded-md" />
          <Skeleton className="h-2 w-[78%] rounded-md" />
          <Skeleton className="h-2 w-[86%] rounded-md" />
          <Skeleton className="h-2 w-[45%] rounded-md" />
        </div>
      </div>
    </div>

    </div>
  );
}
