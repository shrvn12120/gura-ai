"use client";

import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="space-y-6">
      {/* First User Message Skeleton */}
      <div className="w-full flex justify-end">

          <div className="max-w-[85%] sm:max-w-[80%] space-y-2.5 pt-0.5 w-full">
          <div className="p-4 rounded-2xl rounded-tr-xs bg-slate-900/80 border border-slate-800/80 space-y-3">
            <Skeleton className="h-2 w-[92%] rounded-md bg-slate-800" />
            
          </div>
        </div>
      </div>


      {/* First Assistant Response Skeleton */}
      <div className="flex items-start gap-3.5 justify-start">
     
        <div className="max-w-[85%] sm:max-w-[80%] space-y-2.5 pt-0.5 w-full">
          <div className="p-4 rounded-2xl rounded-tl-xs bg-slate-900/80 border border-slate-800/80 space-y-3">
            <Skeleton className="h-2 w-[92%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[78%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[86%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[45%] rounded-md bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Second User Message Skeleton */}
      <div className="w-full flex justify-end">

          <div className="max-w-[65%] sm:max-w-[60%] space-y-2.5 pt-0.5 w-full">
          <div className="p-4 rounded-2xl rounded-tr-xs bg-slate-900/80 border border-slate-800/80 space-y-3">
            <Skeleton className="h-2 w-[92%] rounded-md bg-slate-800" />
            
          </div>
        </div>
      </div>

      {/* Second Assistant Response Skeleton */}
      <div className="flex items-start gap-3.5 justify-start opacity-60">
       

        <div className="max-w-[85%] sm:max-w-[80%] space-y-2.5 pt-0.5 w-full">
          <div className="p-4 rounded-2xl rounded-tl-xs bg-slate-900/80 border border-slate-800/80 space-y-3">
            <Skeleton className="h-2 w-[88%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[70%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[82%] rounded-md bg-slate-800" />
             <Skeleton className="h-2 w-[70%] rounded-md bg-slate-800" />
            <Skeleton className="h-2 w-[82%] rounded-md bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}