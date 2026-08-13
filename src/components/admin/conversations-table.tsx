"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Copy,
  Check,
  Eye,
  Trash2,
  MessageSquare,
  Zap,
  Wand,
} from "lucide-react";
import Link from "next/link";
import { syncConversation } from "@/app/action";

export type Conversation = {
  id: string;
  openai_conversation_id: string;
  object: string;
  created_at: number; // Unix timestamp
  first_item: {
    id: string;
    type: string;
    status: "completed" | "in_progress" | "failed" | string;
    content: Array<{
      type: string;
      text: string;
    }>;
    role: string;
  };
  num_responses: number;
  num_tokens: number;
  metadata: Record<string, unknown>;
};

interface ConversationsTableProps {
  conversations: Conversation[];
}

export function ConversationsTable({
  conversations,
}: ConversationsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          >
            Completed
          </Badge>
        );
      case undefined:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse"
          >
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
          <TableRow>
            <TableHead className="w-45">Conversation ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Responses</TableHead>
            <TableHead className="text-right">Tokens Used</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                No conversations found.
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((conv) => (
              <TableRow
                key={conv?.id}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
              >
                {/* Conversation ID with Copy feature */}
                <TableCell className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <span title={conv?.id}>
                      {conv.id.slice(0, 10)}...{conv.id.slice(-6)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => handleCopyId(conv.id)}
                    >
                      {copiedId === conv.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {getStatusBadge(conv?.first_item?.status)}
                </TableCell>

                {/* Responses */}
                <TableCell className="text-right font-medium">
                  <div className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{conv?.num_responses}</span>
                  </div>
                </TableCell>

                {/* Tokens Used */}
                <TableCell className="text-right font-medium">
                  <div className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 text-xs">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>{conv?.num_tokens?.toLocaleString()}</span>
                  </div>
                </TableCell>

                {/* Created At */}
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(conv?.created_at)}
                </TableCell>

                {/* Action Dropdown */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleCopyId(conv.id)}>
                        <Copy className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link className="flex space-x-2 items-center" href={`/admin/conversations/${conv.id}`}>
                         <Eye className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                        View details
                        </Link>
                       
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={(()=>{
                        syncConversation(conv.id
)
                      })}>

                         <Wand className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                          Sync Data
                        
                       
                      </DropdownMenuItem>
                      <DropdownMenuItem
                      disabled
                        
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
