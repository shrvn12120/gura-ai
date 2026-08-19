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

export function ConversationsTableSkeleton({ rowCount = 5 }: TableSkeletonProps) {
  return (
 <div className="space-y-8 my-8 w-full">


        <Card>
      <CardHeader >
       <CardTitle>User chat sessions</CardTitle>
          <CardDescription>
           Monitor users chat sessions from here
          </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        
   <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Responses</TableHead>
            <TableHead className="text-right">Tokens Used</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i}>
             

              {/* Status Badge */}
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>

              {/* Responses */}
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-6" />
                </div>
              </TableCell>

              {/* Tokens Used */}
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </TableCell>

              {/* Created At */}
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>

              {/* Actions Button */}
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