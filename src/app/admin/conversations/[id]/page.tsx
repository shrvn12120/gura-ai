import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Bot,
  User,
  Hash,
  Sparkles,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import MarkdownMessage from "@/components/markdown-message";


interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowConvPage({ params }: EditPageProps) {
  const { id } = await params;

  let data;
  try {
    const conversation = await fetch(
      `https://api.openai.com/v1/conversations/${id}/items`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "openai-project": "proj_8ewh1krDbm88VZ6yAcO1JlIx",
        },
        next: { revalidate: 0 },
      }
    );

    if (!conversation.ok) {
      return notFound();
    }

    

    data = await conversation.json();
    console.log({data})
  } catch (error) {
    return notFound();
  }

  if (!data || !data.data) {
    return notFound();
  }

  // Filter out developer messages and construct the history feed
  const history = data.data
    .filter((item: any) => item.type === "message" && item.role !== "developer")
    .map((item: any) => ({
      id: item.id,
      role: item.role as "user" | "assistant",
      content:
        item.content?.map((c: any) => c.text || c.transcript || "").join("\n") ||
        "No content",
      created_at: item.created_at,
    }))
    .reverse();

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-4 md:p-8 font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/admin/conversations">
              <ArrowLeft className="h-4 w-4" />
              Back to Conversations
            </Link>
          </Button>

          <Badge
            variant="outline"
            className="bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1.5 py-1 px-3"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Inspection Mode
          </Badge>
        </div>

        {/* CONVERSATION HEADER CARD */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-900 text-cyan-600 dark:text-cyan-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Conversation Inspector
                  </CardTitle>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-11">
                  Viewing recorded session dialogue and message logs.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  variant="secondary"
                  className="font-mono text-[11px] px-2.5 py-1 "
                >
                  <Hash className="h-3 w-3 mr-1 text-zinc-400" />
                  {id}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator className="bg-zinc-100 dark:bg-zinc-800" />

          {/* CHAT MESSAGES CONTAINER */}
          <CardContent className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mx-auto text-zinc-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  No public messages recorded in this conversation thread.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((msg: any, index: number) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-3 md:gap-4 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* AVATAR */}
                      <Avatar
                        className={`h-8 w-8 shrink-0 rounded-xl border shadow-xs ${
                          isUser
                            ? "bg-zinc-100 border-zinc-800 text-zinc-50 dark:bg-zinc-100 dark:border-zinc-200 dark:text-zinc-900"
                            : "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950 dark:border-cyan-900 dark:text-cyan-400"
                        }`}
                      >
                        <AvatarFallback className="bg-transparent font-medium text-xs">
                          {isUser ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* MESSAGE BUBBLE */}
                      <div
                        className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1.5 ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        {/* ROLE LABEL */}
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {isUser ? "User" : "Assistant"}
                          </span>
                        </div>

                        {/* CONTENT CONTAINER */}
                        <div
                          className={`px-4 py-1 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                            isUser
                              ? "bg-zinc-900 text-zinc-50 dark:bg-black dark:text-zinc-200 rounded-tr-xs whitespace-pre-wrap wrap-break-word"
                              : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-xs w-full"
                          }`}
                        >
                          {isUser ? (
                            msg.content
                          ) : (
                            <MarkdownMessage content={msg.content} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}