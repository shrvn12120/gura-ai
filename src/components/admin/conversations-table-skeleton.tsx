import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface TableSkeletonProps {
  rowCount?: number;
}

export function ConversationsTableSkeleton({
  rowCount = 5,
}: TableSkeletonProps) {
  return (
    <div className="my-8 w-full space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>User chat sessions</CardTitle>
          <CardDescription>
            Monitor users chat sessions from here
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead>Conversation</TableHead>
                <TableHead>Session ID</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Tools</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow key={i}>
                  {/* Conversation */}
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>

                  {/* Session ID */}
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>

                  {/* Requests */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Skeleton className="h-3.5 w-3.5 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </TableCell>

                  {/* Tokens */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Skeleton className="h-3.5 w-3.5 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                  </TableCell>

                  {/* Tools */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Skeleton className="h-3.5 w-3.5 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>

                  {/* Last Activity */}
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}