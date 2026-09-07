"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Bot,
  Clock,
  MessageSquare,
  Wrench,
  Zap,
  AlertCircle,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  ConversationRequest,
  SessionDetail,
} from "@/types/admin-session";
import MarkdownMessage from "@/components/markdown-message";
import { ConversationInspectorSkeleton } from "@/components/admin/conversation-inspector-skeleton";

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
    second: "2-digit",
  });
}

function formatResponseTime(ms: number | null) {
  if (ms === null || ms === undefined) {
    return "-";
  }

  if (ms < 1000) {
    return `${ms} ms`;
  }

  return `${(ms / 1000).toFixed(2)} s`;
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [session, setSession] =
    useState<SessionDetail | null>(null);

  const [requests, setRequests] =
    useState<ConversationRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params;

        setSessionId(resolvedParams.sessionId);

        const response = await fetch(
          `/api/sessions/${resolvedParams.sessionId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load conversation");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Failed to load conversation"
          );
        }

        setSession(data.session);
        setRequests(data.requests || []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load conversation"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  if (loading) {
    return (
      <ConversationInspectorSkeleton />
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-destructive" />

            <h2 className="text-lg font-semibold">
              Failed to load conversation
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {error || "Conversation not found"}
            </p>

            <Link
              href="/admin/conversations"
              className="mt-6 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to conversations
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">

      {/* Header */}

      <div className="flex flex-col gap-4">

        <Link
          href="/admin/conversations"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to conversations
        </Link>

        <div>

          <div className="flex items-center gap-3">

            <h1 className="text-3xl font-bold tracking-tight">
              Conversation
            </h1>

            <Badge variant="outline">
              {requests.length} requests
            </Badge>

          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">

            <span>Session:</span>

            <code className="rounded bg-muted px-2 py-1 text-xs">
              {sessionId}
            </code>

          </div>

        </div>

      </div>

      {/* Statistics */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Requests
                </p>

                <p className="text-xl font-semibold">
                  {formatNumber(session.request_count)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Input Tokens
                </p>

                <p className="text-xl font-semibold">
                  {formatNumber(session.input_tokens)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Output Tokens
                </p>

                <p className="text-xl font-semibold">
                  {formatNumber(session.output_tokens)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Tool Calls
                </p>

                <p className="text-xl font-semibold">
                  {formatNumber(session.tool_calls)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Duration
                </p>

                <p className="text-xl font-semibold">
                  {formatDuration(
                    session.started_at,
                    session.last_activity
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Conversation */}

      <Card>

        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="space-y-6">

            {requests.map((request, index) => (

              <div
                key={request.id}
                className="space-y-4"
              >

                {/* User */}

                {request.user_message && (
                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          User
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(request.created_at)}
                        </span>
                      </div>

                      <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap">
                        {request.user_message}
                      </div>

                    </div>

                  </div>
                )}

                {/* Assistant */}

                {request.assistant_response && (
                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          AI
                        </span>

                        <Badge
                          variant={
                            request.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {request.model}
                        </Badge>
                      </div>

                      <div className="rounded-lg border p-4 whitespace-pre-wrap">
                      <MarkdownMessage content={request.assistant_response} />  
                      </div>

                    </div>

                  </div>
                )}

                {/* Request metadata */}

                <div className="ml-11 rounded-lg border bg-muted/20 p-3">

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">

                    <span>
                      Request #{index + 1}
                    </span>

                    <span>
                      Input:{" "}
                      {formatNumber(request.input_tokens)}
                    </span>

                    <span>
                      Output:{" "}
                      {formatNumber(request.output_tokens)}
                    </span>

                    <span>
                      Total:{" "}
                      {formatNumber(request.total_tokens)}
                    </span>

                    <span>
                      Tools: {request.tool_calls}
                    </span>

                    <span>
                      Latency:{" "}
                      {formatResponseTime(
                        request.response_time_ms
                      )}
                    </span>

                    <Badge
                      variant={
                        request.status === "error"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {request.status}
                    </Badge>

                  </div>

                  {request.error_message && (
                    <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                      {request.error_message}
                    </div>
                  )}

                </div>

                {index < requests.length - 1 && (
                  <div className="border-t" />
                )}

              </div>

            ))}

          </div>

        </CardContent>

      </Card>

    </div>
  );
}

function formatDuration(
  start: string,
  end: string
) {
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