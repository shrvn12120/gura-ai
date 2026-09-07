import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ConversationInspectorSkeletonProps {
  messageCount?: number;
}

export function ConversationInspectorSkeleton({
  messageCount = 4,
}: ConversationInspectorSkeletonProps) {
  return (
    <div className="min-h-screen w-full  font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <div className="mx-auto w-full space-y-6">
        {/* BACK / NAVIGATION */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>

        {/* SESSION HEADER */}
        <Card className="border-zinc-200/80  shadow-xs backdrop-blur-md dark:border-zinc-800 ">
          <CardHeader className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-72" />
              </div>

              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
          </CardHeader>
        </Card>

        {/* SESSION STATISTICS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Requests */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>

          {/* Tokens */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-14" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        </div>

        {/* CONVERSATION */}
        <Card className="border-zinc-200/80 shadow-xs backdrop-blur-md dark:border-zinc-800 ">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle>
                  <Skeleton className="h-6 w-36" />
                </CardTitle>
                <Skeleton className="h-4 w-56" />
              </div>

              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </CardHeader>

          <Separator className="bg-zinc-100 dark:bg-zinc-800" />

          <CardContent className="p-6">
            <div className="space-y-8">
              {Array.from({ length: messageCount }).map((_, index) => {
                const isUser = index % 2 === 0;

                return (
                  <div key={index} className="space-y-4">
                    {/* REQUEST METADATA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>

                      <Skeleton className="h-4 w-20" />
                    </div>

                    {/* USER MESSAGE */}
                    {isUser && (
                      <div className="flex flex-row-reverse gap-3 md:gap-4">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />

                        <div className="flex max-w-[85%] flex-col items-end space-y-1.5 sm:max-w-[75%]">
                          <Skeleton className="h-3 w-12" />

                          <div className="w-full space-y-2 rounded-2xl rounded-tr-xs p-4 ">
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[65%]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ASSISTANT MESSAGE */}
                    {!isUser && (
                      <div className="flex gap-3 md:gap-4">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />

                        <div className="flex max-w-[85%] flex-col items-start space-y-1.5 sm:max-w-[75%]">
                          <Skeleton className="h-3 w-16" />

                          <div className="w-full space-y-3 rounded-2xl rounded-tl-xs border border-zinc-200/80 p-4 dark:border-zinc-800 ">
                            <Skeleton className="h-4 w-[95%]" />
                            <Skeleton className="h-4 w-[85%]" />
                            <Skeleton className="h-4 w-[70%]" />

                            {/* Markdown-like extra lines */}
                            <div className="space-y-2 pt-1">
                              <Skeleton className="h-3.5 w-[60%]" />
                              <Skeleton className="h-3.5 w-[80%]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REQUEST DETAILS */}
                    <div className="ml-11 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>

                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>

                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>

                    {index < messageCount - 1 && (
                      <Separator className="mt-6 bg-zinc-100 dark:bg-zinc-800" />
                    )}
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