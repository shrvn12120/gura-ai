"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { 
  Sparkles, 
  ArrowUp, 
  PlusCircle, 
  Search, 
  Loader2, 
  Copy, 
  Check, 
  RotateCw, 
  Compass, 
  Anchor, 
  Ship, 
  MapPin 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import NoticeCarousel, { Notice, noticeStyles } from "./notice-carousel";
import MarkdownMessage from "./markdown-message";
import { getSessionId } from "@/lib/session";
import { clearConversationId, getConversationHistory } from "@/app/action";
import { MessageSkeleton } from "./message-skeleton";
import { Spinner } from "./ui/spinner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface Props {
  notices: Notice[];
}

export function formatStreamedMarkdown(text: string): string {
  if (!text) return "";

  let formatted = text;

  // 1. Convert raw Image URLs (ending in .jpg, .jpeg, .png, .webp, .gif) to Markdown images
  formatted = formatted.replace(
    /(?<!\]\()(https?:\/\/[^\s\)]+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s\)]*)?)/gi,
    (match) => `\n\n![Image](${match})\n\n`
  );

  // 2. Convert raw Web URLs (that aren't images and not already in markdown links) to Markdown links
  formatted = formatted.replace(
    /(?<!\]\(|!\[.*?\]\()(?<!href=")(https?:\/\/[^\s\)]+)(?!\))/gi,
    (match) => `[${match}](${match})`
  );

  // 3. Convert raw Phone numbers (+960 1234567 or +9607771234) ONLY if not already inside a Markdown link
  formatted = formatted.replace(
    /(?<!\[|\()(b\+960\s?\d{7}\b)(?!\]|\))/gi,
    (match) => {
      const cleanNum = match.replace(/\s+/g, "");
      return `[${match}](tel:${cleanNum})`;
    }
  );

  // 4. Convert raw Email addresses into mailto: links ONLY if not already inside a Markdown link
  formatted = formatted.replace(
    /(?<!\[|\()(b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)(?!\]|\))/gi,
    (match) => `[${match}](mailto:${match})`
  );

  return formatted;
}

export default function ChatUi({ notices }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const placeholderIndexRef = useRef(0);
  const chatLimit = 20;

  const normalPlaceholder = useMemo(
    () => [
    "Guide me to my guesthouse.",
    "Guíame hasta mi casa de...",
    "带我去我的旅馆。",
    "Проводите меня до моего го....",
    ],
    []
  );

  const messageLimitReachPlaceholder = useMemo(
    () => ["Limit reached, please create a new chat"],
    []
  );

  const placeholders = useMemo(() => {
    return messages.length >= chatLimit
      ? messageLimitReachPlaceholder
      : normalPlaceholder;
  }, [messages.length, chatLimit, messageLimitReachPlaceholder, normalPlaceholder]);

  /*
   * --------------------------------------------------
   * Load Chat History
   * --------------------------------------------------
   */
  const loadChatHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await getConversationHistory();

      if (res) {
        const history = typeof res === "string" ? JSON.parse(res) : res;
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to fetch conversation history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /*
   * --------------------------------------------------
   * Initial load & Placeholder Rotation
   * --------------------------------------------------
   */
  useEffect(() => {
    loadChatHistory();

    const interval = setInterval(() => {
      placeholderIndexRef.current =
        (placeholderIndexRef.current + 1) % placeholders.length;

      if (textareaRef.current) {
        textareaRef.current.placeholder =
          placeholders[placeholderIndexRef.current];
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [loadChatHistory, placeholders]);

  /*
   * --------------------------------------------------
   * Auto scroll
   * --------------------------------------------------
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, toolStatus]);

  /*
   * --------------------------------------------------
   * Send message
   * --------------------------------------------------
   */
  // async function sendMessage(customQuery?: string) {
  //   const query = (customQuery || input).trim();
  //   if (!query || loading) return;

  //   const userMessage: Message = {
  //     role: "user",
  //     content: query,
  //   };

  //   const assistantPlaceholder: Message = {
  //     role: "assistant",
  //     content: "",
  //   };

  //   setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

  //   setInput("");
  //   setLoading(true);
  //   setToolStatus(null);

  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = "auto";
  //   }

  //   try {
  //     const sessionId = getSessionId();
  //     const res = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/x-ndjson",
  //       },
  //       body: JSON.stringify({
  //         sessionId,
  //         message: query,
  //       }),
  //     });

  //     if (!res.ok) {
  //       const errorText = await res.text();
  //       console.error("API ERROR:", res.status, errorText);
  //       throw new Error(`API request failed: ${res.status}`);
  //     }

  //     if (!res.body) {
  //       throw new Error("No readable data stream available");
  //     }

  //     const reader = res.body.getReader();
  //     const decoder = new TextDecoder();

  //     let buffer = "";
  //     let fullResponseText = "";

  //     while (true) {
  //       const { value, done } = await reader.read();
  //       if (done) break;

  //       buffer += decoder.decode(value, { stream: true });
  //       const lines = buffer.split("\n");
  //       buffer = lines.pop() ?? "";

  //       for (const line of lines) {
  //         const trimmed = line.trim();
  //         if (!trimmed) continue;

  //         let event: any;
  //         try {
  //           event = JSON.parse(trimmed);
  //         } catch (error) {
  //           console.error("Failed to parse NDJSON:", trimmed, error);
  //           continue;
  //         }

  //         if (event.type === "text" && typeof event.delta === "string") {
  //           fullResponseText += event.delta;

  //           setMessages((prev) => {
  //             const copy = [...prev];
  //             if (copy.length > 0) {
  //               copy[copy.length - 1] = {
  //                 role: "assistant",
  //                 content: fullResponseText,
  //               };
  //             }
  //             return copy;
  //           });
  //           continue;
  //         }

  //         if (event.type === "tool_start") {
  //           if (event.tool === "search_guraidhoo") {
  //             setToolStatus("Searching Guraidhoo guides...");
  //           } else {
  //             setToolStatus("Looking up local info...");
  //           }
  //           continue;
  //         }

  //         if (event.type === "tool_end") {
  //           setToolStatus(null);
  //           continue;
  //         }

  //         if (event.type === "done") {
  //           setToolStatus(null);
  //           continue;
  //         }

  //         if (event.type === "error") {
  //           throw new Error(event.error || "AI streaming error");
  //         }
  //       }
  //     }

  //     const remaining = buffer.trim();
  //     if (remaining) {
  //       try {
  //         const event = JSON.parse(remaining);
  //         if (event.type === "error") {
  //           throw new Error(event.error || "AI streaming error");
  //         }
  //       } catch (error) {
  //         console.error("Final NDJSON parse error:", error);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Chat Error:", error);

  //     setMessages((prev) => {
  //       const copy = [...prev];
  //       if (copy.length > 0) {
  //         copy[copy.length - 1] = {
  //           role: "assistant",
  //           content:
  //             "Something went wrong while connecting to the island AI. Please try again.",
  //         };
  //       }
  //       return copy;
  //     });
  //   } finally {
  //     setLoading(false);
  //     setToolStatus(null);
  //   }
  // }
async function sendMessage(customQuery?: string) {
  const query = (customQuery || input).trim();
  if (!query || loading) return;

  const userMessage: Message = { role: "user", content: query };
  const assistantPlaceholder: Message = { role: "assistant", content: "" };

  setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
  setInput("");
  setLoading(true);
  setToolStatus(null);

  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
  }

  try {
    const sessionId = getSessionId();
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify({ sessionId, message: query }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API ERROR:", res.status, errorText);
      throw new Error(`API request failed: ${res.status}`);
    }

    if (!res.body) throw new Error("No readable data stream available");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let fullResponseText = "";

    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let event: any;
      try {
        event = JSON.parse(trimmed);
      } catch (error) {
        console.error("Failed to parse NDJSON line:", trimmed, error);
        return;
      }

      // Auto-converts raw URLs, emails, and phone numbers in incoming text streams into valid Markdown

      if (event.type === "text" && typeof event.delta === "string") {
        fullResponseText += event.delta;

        const cleanContent = formatStreamedMarkdown(fullResponseText);
      setMessages((prev) => {
          const copy = [...prev];
          if (copy.length > 0) {
            copy[copy.length - 1] = {
              role: "assistant",
              content: cleanContent,
            };
          }
    return copy;
  });
      } else if (event.type === "tool_start") {
        setToolStatus(
          event.tool === "search_guraidhoo"
            ? "Searching Guraidhoo guides..."
            : "Looking up local info..."
        );
      } else if (event.type === "tool_end" || event.type === "done") {
        setToolStatus(null);
      } else if (event.type === "error") {
        throw new Error(event.error || "AI streaming error");
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        processLine(line);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processLine(buffer);
    }
  } catch (error) {
    console.error("Chat Error:", error);
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Something went wrong while connecting to the island AI. Please try again.",
        };
      }
      return copy;
    });
  } finally {
    setLoading(false);
    setToolStatus(null);
  }
}
  /*
   * --------------------------------------------------
   * Action Helpers
   * --------------------------------------------------
   */
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRetry = () => {
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-950 font-sans antialiased text-slate-100 overflow-hidden relative">
      {/* FIXED HEADER */}
      <header className="shrink-0 z-50 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 md:px-8 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border border-teal-500/30 bg-teal-950/50 text-teal-400 shadow-md shadow-teal-950/50">
              <Image
                alt="Logo"
                src="/web-app-manifest-512x512.png"
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
            </Avatar>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight leading-tight text-slate-100">
                Explore Guraidhoo
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                AI Guide
              </span>
            </div>

            {notices?.length >= 1 ? (
              <p
                className={`text-[11px] font-medium flex items-center gap-1.5 mt-0.5 ${
                  noticeStyles[notices[0].type].text
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    noticeStyles[notices[0].type].color
                  } animate-pulse`}
                />
                Active {notices[0].type}
                <Link
                  className="underline hover:opacity-80 transition-opacity font-semibold ml-0.5"
                  href="/notice"
                >
                  View
                </Link>
              </p>
            ) : (
              // <p className="text-[11px] font-medium text-teal-400/80 flex items-center gap-1.5 mt-0.5">
              //   <Compass className="h-3 w-3 text-teal-400" />
              //   Agent active
              // </p>
               <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pre-release v1.0.0-beta.2
              </p>
            )}
          </div>
        </div>

        <Button
          disabled={historyLoading || loading}
          onClick={async () => {
            await clearConversationId();
            window.location.reload();
          }}
          variant="outline"
          className="h-8 px-3 text-xs font-medium rounded-xl border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-xs"
          size="sm"
        >
          {historyLoading ? (
            <Spinner className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
          )}
          New Chat
        </Button>
      </header>

      {/* SCROLLABLE MESSAGE FEED (Hidden Scrollbars) */}
      <ScrollArea className="flex-1 w-full overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 space-y-6">
          {historyLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-center pt-8 md:pt-16 space-y-6">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-teal-500 to-emerald-500 opacity-30 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-teal-500/30 text-teal-400 shadow-xl">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-2 w-full max-w-md">
                {notices?.length >= 1 ? (
                  <div className="w-full">
                    <h2 className="text-xs font-semibold text-slate-400 mb-4 tracking-wider uppercase">
                      Announcements
                    </h2>
                    <NoticeCarousel notices={notices} />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                      Welcome to K. Guraidhoo
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Your local AI guide. Ask about speedboat schedules, guesthouses, bikini beaches, or hidden dining spots.
                    </p>
                  </>
                )}
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl pt-4">
                {[
                  { icon: Ship, title: "Speedboat Timings", desc: "Schedules to & from Malé" },
                  { icon: MapPin, title: "Bikini Beach Location", desc: "Rules and location maps" },
                  { icon: Anchor, title: "Excursions & Diving", desc: "Manta rays, surfing, fishing" },
                  { icon: Compass, title: "Island Guesthouses", desc: "Find local stays" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(item.title)}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-teal-500/30 text-left transition-all group"
                  >
                    <item.icon className="h-5 w-5 text-teal-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
                          {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3.5 group ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >

                  {msg.role === "user" ? (
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-teal-600 px-4 py-3 text-sm text-white shadow-md shadow-teal-950/20">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-[95%] sm:max-w-[85%] space-y-2 pt-0.5 w-full">
                      <div className="text-sm text-slate-200 leading-relaxed font-normal  p-4 rounded-2xl rounded-tl-xs shadow-sm">
                        {msg.content ? (
                          <MarkdownMessage content={msg.content} />
                        ) : (
                          loading &&
                          i === messages.length - 1 && (
                            <div className="flex items-center gap-1.5 py-1 text-teal-400 text-sm">
                              <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                              <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                              <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" />
                            </div>
                          )
                        )}
                      </div>

                      {/* Assistant Message Actions */}
                      {msg.content && (
                        <div className="flex items-center gap-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-300 text-[11px] transition-colors"
                          >
                            {copiedIndex === i ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-teal-400" />
                                <span className="text-teal-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {i === messages.length - 1 && (
                            <button
                              onClick={handleRetry}
                              disabled={loading}
                              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-300 text-[11px] transition-colors disabled:opacity-50"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              


              {/* TOOL STATUS */}
              {toolStatus && (
                <div className="flex items-center gap-3 ml-11 text-xs text-slate-400 animate-fade-in">
                  <div className="flex items-center gap-2 rounded-xl border border-teal-500/20 bg-slate-900/90 px-3.5 py-2 shadow-sm backdrop-blur-md">
                    <Search className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                    <span className="font-medium text-slate-300">{toolStatus}</span>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* FIXED INPUT AREA AT BOTTOM */}
      <div className="shrink-0 z-50 p-4 bg-linear-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50 transition-all duration-200">
            <Textarea
              ref={textareaRef}
              value={input}
              placeholder={placeholders[0]}
              onFocus={(()=> bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    }))}
              onChange={handleInput}
              onKeyDown={onKeyDown}
              disabled={loading || messages.length >= chatLimit || historyLoading}
              className="w-full min-h-13 max-h-32 resize-none border-0 bg-transparent py-3.5 pl-4 pr-14 text-base md:text-sm text-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500"
              rows={1}
            />

            <div className="absolute right-2.5 bottom-2.5">
              <Button
                onClick={() => sendMessage()}
                disabled={
                  loading || !input.trim() || messages.length >= chatLimit || historyLoading
                }
                size="icon"
                className="h-8 w-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-md shadow-teal-950/50 disabled:opacity-30 disabled:hover:bg-teal-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-500 mt-2 tracking-wide">
            Local tips reflect real-time seasonal dynamic shifts on K. Guraidhoo.
          </p>
        </div>
      </div>
    </div>
  );
}