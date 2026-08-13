import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ConversationInspectorSkeletonProps {
  messageCount?: number;
}

export function ConversationInspectorSkeleton({
  messageCount = 4,
}: ConversationInspectorSkeletonProps) {
  return (
    <div className="w-full min-h-screen bg-zinc-50/50 dark:bg-zinc-950  font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <div className="w-full mx-auto space-y-6">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        {/* CONVERSATION HEADER CARD */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-3.5 w-64 ml-11" />
              </div>

              <div className="self-start sm:self-auto">
                <Skeleton className="h-6 w-44 rounded-md" />
              </div>
            </div>
          </CardHeader>

          <Separator className="bg-zinc-100 dark:bg-zinc-800" />

          {/* CHAT MESSAGES SKELETON */}
          <CardContent className="p-6">
            <div className="space-y-6">
              {Array.from({ length: messageCount }).map((_, index) => {
                const isUser = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={`flex gap-3 md:gap-4 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* AVATAR SKELETON */}
                    <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />

                    {/* MESSAGE BUBBLE SKELETON */}
                    <div
                      className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1.5 ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* ROLE LABEL */}
                      <Skeleton className="h-3 w-16 px-1" />

                      {/* BUBBLE CONTENT */}
                      <div
                        className={`p-4 rounded-2xl w-full space-y-2 ${
                          isUser
                            ? "bg-zinc-200 dark:bg-zinc-800 rounded-tr-xs"
                            : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-xs"
                        }`}
                      >
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-4 w-[75%]" />
                        {!isUser && <Skeleton className="h-4 w-[50%]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}