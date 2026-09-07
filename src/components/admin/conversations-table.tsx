"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  MessageSquare,
  Wrench,
  Zap,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Session } from "@/types/admin-session";


function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string) {
  const diff =
    new Date(end).getTime() -
    new Date(start).getTime();

  if (diff < 1000) {
    return "<1s";
  }

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

function truncate(text: string | null, length = 80) {
  if (!text) {
    return "No user message";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
}

export default function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sessions", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch sessions");
      }

      setSessions(data.sessions || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load sessions"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const totalTokens = sessions.reduce(
    (sum, session) => sum + Number(session.total_tokens || 0),
    0
  );

  const totalRequests = sessions.reduce(
    (sum, session) => sum + Number(session.request_count || 0),
    0
  );

  const totalToolCalls = sessions.reduce(
    (sum, session) => sum + Number(session.tool_calls || 0),
    0
  );

  const totalErrors = sessions.reduce(
    (sum, session) => sum + Number(session.error_count || 0),
    0
  );

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Sessions
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(sessions.length)}
                </p>
              </div>

              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  AI Requests
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(totalRequests)}
                </p>
              </div>

              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tokens
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(totalTokens)}
                </p>
              </div>

              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Errors
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(totalErrors)}
                </p>
              </div>

              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Table */}
      <Card>

        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Conversation Sessions</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Each row represents one user session.
            </p>
          </div>

          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </CardHeader>

        <CardContent>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-md border">

            <Table>

              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">

                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead className="text-right">
                    Requests
                  </TableHead>
                  <TableHead className="text-right">
                    Tokens
                  </TableHead>
                  <TableHead className="text-right">
                    Tools
                  </TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>

              </TableHeader>

              <TableBody>

                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center"
                    >
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No conversation sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (

                    <TableRow key={session.session_id}>

                      <TableCell className="max-w-[320px]">
                        <div className="space-y-1">

                          <p className="truncate font-medium">
                            {truncate(
                              session.first_user_message,
                              70
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Started{" "}
                            {formatDate(session.started_at)}
                          </p>

                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {session.session_id.slice(0, 12)}...
                        </code>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          {session.request_count}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(
                          Number(session.total_tokens)
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                          {session.tool_calls}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />

                          {formatDuration(
                            session.started_at,
                            session.last_activity
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(session.last_activity)}
                      </TableCell>

                      <TableCell className="text-right">

                        <Link
                          href={`/admin/conversations/${session.session_id}`}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                        >
                          <Eye className="h-4 w-4" />
                          Inspect
                        </Link>

                      </TableCell>

                    </TableRow>

                  ))
                )}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}