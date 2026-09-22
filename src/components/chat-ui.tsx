"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

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
  MapPin,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import NoticeCarousel, {
  Notice,
  noticeStyles,
} from "./notice-carousel";

import MarkdownMessage from "./markdown-message";
import { MessageSkeleton } from "./message-skeleton";
import { Spinner } from "./ui/spinner";

import {
  appendMessage,
  createMessageId,
  deleteConversation,
  getChatState,
  saveInteractionId,
  type StoredMessage,
} from "@/lib/chatStorage";


/* =========================================================
   TYPES
========================================================= */

type Message = StoredMessage;

interface Props {
  notices: Notice[];
}

type MessageRowProps = {
  message: Message;
  index: number;
  isLastAssistant: boolean;
  loading: boolean;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  onRetry: () => void;
};

const MessageRow = React.memo(
  function MessageRow({
    message,
    index,
    isLastAssistant,
    loading,
    copiedIndex,
    onCopy,
    onRetry,
  }: MessageRowProps) {
    const isUser = message.role === "user";

    return (
      <div
        className={`flex items-start gap-3.5 group ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {isUser ? (
          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-teal-600 px-4 py-3 text-sm text-white shadow-md shadow-teal-950/20">
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        ) : (
          <div className="max-w-[95%] sm:max-w-[85%] space-y-2 pt-0.5 w-full">
            <div className="text-sm dark:text-slate-200 text-teal-700 leading-relaxed font-normal p-4 rounded-2xl rounded-tl-xs shadow-sm">
              {message.content ? (
                <MarkdownMessage content={message.content} />
              ) : (
                loading && isLastAssistant && (
                  <div className="flex items-center gap-1.5 py-1 text-teal-400 text-sm">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" />
                  </div>
                )
              )}
            </div>

            {message.content && (
              <div className="flex items-center gap-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                <button
                  onClick={() => onCopy(message.content, index)}
                  className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-300 text-[11px] transition-colors"
                >
                  {copiedIndex === index ? (
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

                {isLastAssistant && (
                  <button
                    onClick={onRetry}
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
    );
  },
  (prev, next) => {
    return (
      prev.message === next.message &&
      prev.index === next.index &&
      prev.isLastAssistant === next.isLastAssistant &&
      prev.loading === next.loading &&
      prev.copiedIndex === next.copiedIndex &&
      prev.onCopy === next.onCopy &&
      prev.onRetry === next.onRetry
    );
  }
);

MessageRow.displayName = "MessageRow";

/* =========================================================
   MARKDOWN FORMATTER
========================================================= */

export function formatStreamedMarkdown(
  text: string
): string {
  if (!text) return "";

  let formatted = text;

  /*
   * 1. Raw image URLs
   */
  formatted = formatted.replace(
    /(?<!\]\()(https?:\/\/[^\s\)]+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s\)]*)?)/gi,
    (match) =>
      `\n\n![Image](${match})\n\n`
  );

  /*
   * 2. Raw URLs
   */
  formatted = formatted.replace(
    /(?<!\]\(|!\[.*?\]\()(?<!href=")(https?:\/\/[^\s\)]+)(?!\))/gi,
    (match) =>
      `[${match}](${match})`
  );

  /*
   * 3. Phone numbers
   */
  formatted = formatted.replace(
    /(?<!\[|\()(\+960\s?\d{7}\b)(?!\]|\))/gi,
    (match) => {
      const cleanNum =
        match.replace(/\s+/g, "");

      return `[${match}](tel:${cleanNum})`;
    }
  );

  /*
   * 4. Email addresses
   */
  formatted = formatted.replace(
    /(?<!\[|\()([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)(?!\]|\))/gi,
    (match) =>
      `[${match}](mailto:${match})`
  );

  return formatted;
}

function getTimestampMs(): number {
  return Date.now();
}

/* =========================================================
   CHAT UI
========================================================= */

export default function ChatUi({
  notices,
}: Props) {
  /* =======================================================
     STATE
  ======================================================= */

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [toolStatus, setToolStatus] =
    useState<string | null>(null);

  const [copiedIndex, setCopiedIndex] =
    useState<number | null>(null);

  /*
   * Gemini Interactions API conversation ID.
   *
   * This is stored in localStorage together
   * with the conversation.
   */
  const [interactionId, setInteractionId] =
    useState<string | null>(null);

  /* =======================================================
     REFS
  ======================================================= */

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const scrollViewportRef =
    useRef<HTMLDivElement | null>(null);

  const placeholderIndexRef =
    useRef(0);

  const pendingAssistantUpdateRef =
    useRef<number | null>(null);

  const pendingScrollFrameRef =
    useRef<number | null>(null);

  const lastRenderedAssistantTextRef =
    useRef("");

  const shouldFollowScrollRef =
    useRef(true);

  const chatLimit = 20;

  /* =======================================================
     PLACEHOLDERS
  ======================================================= */

  const normalPlaceholder =
    useMemo(
      () => [
        "Guide me to my guesthouse.",
        "Guíame hasta mi casa de...",
        "带我去我的旅馆。",
        "Проводите меня до моего го....",
      ],
      []
    );

  const messageLimitReachPlaceholder =
    useMemo(
      () => [
        "Limit reached, please create a new chat",
      ],
      []
    );

  const placeholders = useMemo(() => {
    return messages.length >= chatLimit
      ? messageLimitReachPlaceholder
      : normalPlaceholder;
  }, [
    messages.length,
    chatLimit,
    messageLimitReachPlaceholder,
    normalPlaceholder,
  ]);

  /* =======================================================
     INITIALIZE SESSION + LOCAL CHAT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;
    async function initializeChat() {
      try {
        setHistoryLoading(true);

        /*
         * Make sure the browser has a session_id
         * HttpOnly cookie.
         *
         * We intentionally do NOT store session_id
         * in localStorage.
         */
        const sessionResponse =
          await fetch(
            "/api/session",
            {
              method: "GET",
              credentials: "include",
            }
          );

        if (!sessionResponse.ok) {
          throw new Error(
            "Failed to initialize chat session."
          );
        }

        /*
         * Read conversation from browser localStorage.
         */
        const state =
          getChatState();

        if (cancelled) {
          return;
        }

        setMessages(
          state.messages.filter(
            (message) =>
              message.role !==
              "system"
          )
        );

        /*
         * Restore Gemini interaction chain.
         */
        setInteractionId(
          state.interactionId
        );
      } catch (error) {
        console.error(
          "Failed to initialize chat:",
          error
        );
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    initializeChat();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     PLACEHOLDER ROTATION
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        placeholderIndexRef.current =
          (placeholderIndexRef.current + 1) %
          placeholders.length;

        if (textareaRef.current) {
          textareaRef.current.placeholder =
            placeholders[
              placeholderIndexRef.current
            ];
        }
      }, 4000);

    return () =>
      clearInterval(interval);
  }, [placeholders]);

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  const isNearBottom = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) {
        return true;
      }

      const threshold = 140;
      const distance =
        element.scrollHeight -
        element.scrollTop -
        element.clientHeight;

      return distance <= threshold;
    },
    []
  );

  useEffect(() => {
    const element = scrollViewportRef.current;

    if (!element) {
      return;
    }

    const handleScroll = () => {
      shouldFollowScrollRef.current =
        isNearBottom(element);
    };

    handleScroll();
    element.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (
        pendingScrollFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          pendingScrollFrameRef.current
        );
        pendingScrollFrameRef.current = null;
      }
    };
  }, [isNearBottom]);

  useEffect(() => {
    const element = scrollViewportRef.current;

    if (!element) {
      return;
    }

    const shouldAutoScroll =
      isNearBottom(element);

    if (!shouldAutoScroll) {
      return;
    }

    const behavior: ScrollBehavior =
      loading ? "auto" : "smooth";

    const frame = requestAnimationFrame(() => {
      const current = scrollViewportRef.current;

      if (!current) {
        return;
      }

      current.scrollTo({
        top: current.scrollHeight,
        behavior,
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [messages, toolStatus, loading, isNearBottom]);

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage = useCallback(
    async function sendMessage(
      customQuery?: string
    ) {
    const query = (
      customQuery || input
    ).trim();

    if (
      !query ||
      loading ||
      historyLoading
    ) {
      return;
    }

    /*
     * ================================================
     * USER MESSAGE
     * ================================================
     */

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      content: query,
      createdAt: getTimestampMs(),
    };

    /*
     * Save immediately to localStorage.
     */
    appendMessage(userMessage);

    /*
     * Update UI.
     */
    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    /*
     * ================================================
     * ASSISTANT PLACEHOLDER
     * ================================================
     */

    const assistantMessageId =
      createMessageId();

    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: getTimestampMs(),
    };

    setMessages((prev) => [
      ...prev,
      assistantPlaceholder,
    ]);

    setInput("");
    setLoading(true);
    setToolStatus(null);

    if (textareaRef.current) {
      textareaRef.current.style.height =
        "auto";
    }

    /*
     * Accumulates the complete streamed
     * assistant response.
     */
    let fullResponseText = "";
    lastRenderedAssistantTextRef.current = "";

    const flushAssistantUpdate = () => {
      if (
        pendingAssistantUpdateRef.current !==
        null
      ) {
        window.clearTimeout(
          pendingAssistantUpdateRef.current
        );
        pendingAssistantUpdateRef.current =
          null;
      }

      if (
        fullResponseText ===
        lastRenderedAssistantTextRef.current
      ) {
        return;
      }

      lastRenderedAssistantTextRef.current =
        fullResponseText;

      setMessages((prev) =>
        prev.map((message) =>
          message.id ===
          assistantMessageId
            ? {
                ...message,
                content:
                  fullResponseText,
              }
            : message
        )
      );
    };

    const scheduleAssistantUpdate = () => {
      if (
        pendingAssistantUpdateRef.current
      ) {
        return;
      }

      pendingAssistantUpdateRef.current =
        window.setTimeout(() => {
          pendingAssistantUpdateRef.current =
            null;
          flushAssistantUpdate();
        }, 120);
    };

    /*
     * Track whether the response successfully
     * completed.
     */
    let completed = false;

    try {
      /* ================================================
         API REQUEST
      ================================================ */

      const res = await fetch(
        "/api/chat/v3",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/x-ndjson",
          },

          /*
           * IMPORTANT:
           *
           * sessionId is NO LONGER sent.
           *
           * The server reads session_id
           * from the HttpOnly cookie.
           *
           * We only send the Gemini
           * interaction ID.
           */
          body: JSON.stringify({
            message: query,
            interactionId,
          }),
        }
      );

      /* ================================================
         HTTP ERROR
      ================================================ */

      if (!res.ok) {
        const errorText =
          await res.text();

        console.error(
          "API ERROR:",
          res.status,
          errorText
        );

        throw new Error(
          `API request failed: ${res.status}`
        );
      }

      /* ================================================
         STREAM
      ================================================ */

      if (!res.body) {
        throw new Error(
          "No readable data stream available"
        );
      }

      const reader =
        res.body.getReader();

      const decoder =
        new TextDecoder(
          "utf-8"
        );

      let buffer = "";

      /*
       * ==============================================
       * PROCESS NDJSON LINE
       * ==============================================
       */

      const processLine = (
        line: string
      ) => {
        const trimmed =
          line.trim();

        if (!trimmed) {
          return;
        }

        let event: {
        type?: string;
        delta?: string;
        tool?: string;
        message?: string;
        interactionId?: string;
      };

        try {
          event =
            JSON.parse(trimmed) as {
              type?: string;
              delta?: string;
              tool?: string;
              message?: string;
              interactionId?: string;
            };
        } catch (error) {
          console.error(
            "Failed to parse NDJSON line:",
            trimmed,
            error
          );

          return;
        }

        /* ==============================================
           TEXT
        ============================================== */

        if (
          event.type === "text" &&
          typeof event.delta ===
            "string"
        ) {
          fullResponseText +=
            event.delta;
          scheduleAssistantUpdate();

          return;
        }

        /* ==============================================
           TOOL START
        ============================================== */

        if (
          event.type ===
          "tool_start"
        ) {
          if (
            event.tool ===
            "search_guraidhoo"
          ) {
            setToolStatus(
              "Searching Guraidhoo guides..."
            );
          } else {
            setToolStatus(
              "Looking up local info..."
            );
          }

          return;
        }

        /* ==============================================
           TOOL END
        ============================================== */

        if (
          event.type ===
          "tool_end"
        ) {
          setToolStatus(null);
          return;
        }

        /* ==============================================
           DONE
        ============================================== */

        if (
          event.type === "done"
        ) {
          setToolStatus(null);

          flushAssistantUpdate();

          /*
           * Save the Gemini interaction ID.
           *
           * This is what allows the NEXT request
           * to continue the same Gemini conversation.
           */
          if (
            typeof event.interactionId ===
              "string" &&
            event.interactionId
          ) {
            setInteractionId(
              event.interactionId
            );

            saveInteractionId(
              event.interactionId
            );
          }

          /*
           * Save the completed assistant
           * response to localStorage.
           *
           * We only do this ONCE after streaming
           * has finished.
           */
          if (
            fullResponseText.trim()
          ) {
            appendMessage({
              id: assistantMessageId,

              role: "assistant",

              content:
                formatStreamedMarkdown(
                  fullResponseText
                ),

              createdAt: getTimestampMs(),
            });
          }

          completed = true;

          return;
        }

        /* ==============================================
           ERROR
        ============================================== */

        if (
          event.type ===
          "error"
        ) {
          /*
           * Your new API sends:
           *
           * {
           *   type: "error",
           *   message: "..."
           * }
           *
           * NOT:
           *
           * event.error.message
           */
          const errorMessage =
            typeof event.message ===
            "string"
              ? event.message
              : "AI streaming error";

          throw new Error(
            errorMessage
          );
        }
      };

      /* ================================================
         READ STREAM
      ================================================ */

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() ?? "";

        for (
          const line of lines
        ) {
          processLine(line);
        }
      }

      /* ================================================
         FLUSH DECODER
      ================================================ */

      buffer += decoder.decode();

      if (buffer.trim()) {
        processLine(buffer);
      }

      /*
       * If the stream ended without receiving
       * a done event, treat it as an error.
       */
      if (!completed) {
        throw new Error(
          "AI response ended unexpectedly."
        );
      }
    } catch (error) {
      console.error(
        "Chat Error:",
        error
      );

      if (
        pendingAssistantUpdateRef.current !==
        null
      ) {
        window.clearTimeout(
          pendingAssistantUpdateRef.current
        );
        pendingAssistantUpdateRef.current =
          null;
      }

      /*
       * Don't save a failed assistant
       * response to localStorage.
       */

      const fallbackMessage =
        "Something went wrong while connecting to the island AI. Please try again.";

      setMessages(
        (prev) =>
          prev.map(
            (message) =>
              message.id ===
              assistantMessageId
                ? {
                    ...message,
                    content:
                      fallbackMessage,
                  }
                : message
          )
      );
    } finally {
      if (
        pendingAssistantUpdateRef.current !==
        null
      ) {
        window.clearTimeout(
          pendingAssistantUpdateRef.current
        );
        pendingAssistantUpdateRef.current =
          null;
      }

      setLoading(false);
      setToolStatus(null);
    }
  }, [input, loading, historyLoading, interactionId]);

  /* =======================================================
     COPY
  ======================================================= */

  const handleCopy = useCallback(
    (
      text: string,
      index: number
    ) => {
      navigator.clipboard.writeText(
        text
      );

      setCopiedIndex(index);

      setTimeout(
        () =>
          setCopiedIndex(null),
        2000
      );
    },
    []
  );

  /* =======================================================
     RETRY
  ======================================================= */

  const handleRetry = useCallback(() => {
    if (
      messages.length < 2 ||
      loading
    ) {
      return;
    }

    const lastUserMessage =
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role ===
            "user"
        );

    if (
      lastUserMessage
    ) {
      sendMessage(
        lastUserMessage.content
      );
    }
  }, [messages, loading, sendMessage]);

  /* =======================================================
     NEW CHAT
  ======================================================= */

 const handleNewChat = async () => {
  setLoading(true);

  try {
    /*
     * 1. Delete local storage/persisted conversation state.
     * (Awaited in case deleteConversation returns a Promise)
     */
    await deleteConversation();

    /*
     * 2. Clear server-side session cookie via endpoint.
     */
    const sessionResponse = await fetch("/api/session?reset=true", {
      method: "GET",
      credentials: "include",
    });

    if (!sessionResponse.ok) {
      console.error("Failed to reset session cookie on server.");
    }

    /*
     * 3. Reset React state.
     */
    setMessages([]);
    setInteractionId(null);
    setInput("");
    setToolStatus(null);

    /*
     * 4. Reset UI textarea height.
     */
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  } catch (error) {
    console.error("Error starting new chat:", error);
  } finally {
    setLoading(false);
  }
};

  /* =======================================================
     KEYBOARD
  ======================================================= */

  function onKeyDown(
    e: React.KeyboardEvent
  ) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      sendMessage();
    }
  }

  /* =======================================================
     INPUT
  ======================================================= */

  function handleInput(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setInput(
      e.target.value
    );

    const target =
      e.target;

    target.style.height =
      "auto";

    target.style.height = `${Math.min(
      target.scrollHeight,
      128
    )}px`;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex flex-col h-dvh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased overflow-hidden relative">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="shrink-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 md:px-8 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">

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

              <h1 className="text-sm font-semibold tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                Explore Guraidhoo
              </h1>

              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                AI Guide
              </span>

            </div>

            {notices?.length >= 1 ? (
              <p
                className={`text-[11px] font-medium flex items-center gap-1.5 mt-0.5 ${
                  noticeStyles[
                    notices[0].type
                  ].text
                }`}
              >

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    noticeStyles[
                      notices[0].type
                    ].color
                  } animate-pulse`}
                />

                Active{" "}
                {
                  notices[0].type
                }

                <Link
                  className="underline hover:opacity-80 transition-opacity font-semibold ml-0.5"
                  href="/notice"
                >
                  View
                </Link>

              </p>
            ) : (
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">

                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />

                Pre-release v1.0.0-beta.5

              </p>
            )}

          </div>

        </div>

        {/* =================================================
            NEW CHAT
        ================================================= */}

        <Button
          disabled={
            historyLoading ||
            loading
          }
          onClick={
            handleNewChat
          }
          variant="outline"
          className="h-8 px-3 text-xs font-medium rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all shadow-xs"
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

      {/* =================================================
          MESSAGE FEED
      ================================================= */}

      <ScrollArea className="flex-1 w-full overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 space-y-6">

          {historyLoading ? (
            <MessageSkeleton />

          ) : messages.length === 0 ? (

            <div className="w-full flex flex-col items-center justify-center text-center pt-8 md:pt-16 space-y-6">

              <div className="relative">

                <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-teal-500 to-emerald-500 opacity-30 blur-lg" />

                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-teal-500/30 text-teal-600 shadow-xl dark:bg-slate-900 dark:text-teal-400">

                  <Sparkles className="h-7 w-7" />

                </div>

              </div>

              <div className="space-y-2 w-full max-w-md">

                {notices?.length >= 1 ? (

                  <div className="w-full">

                    <h2 className="text-xs font-semibold text-slate-400 mb-4 tracking-wider uppercase">
                      Announcements
                    </h2>

                    <NoticeCarousel
                      notices={
                        notices
                      }
                    />

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

              {/* QUICK PROMPTS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl pt-4">

                {[
                  {
                    icon: Ship,
                    title:
                      "Speedboat Timings",
                    desc:
                      "Schedules to & from Malé",
                  },
                  {
                    icon: MapPin,
                    title:
                      "Bikini Beach Location",
                    desc:
                      "Rules and location maps",
                  },
                  {
                    icon: Anchor,
                    title:
                      "Excursions & Diving",
                    desc:
                      "Manta rays, surfing, fishing",
                  },
                  {
                    icon: Compass,
                    title:
                      "Island Guesthouses",
                    desc:
                      "Find local stays",
                  },
                ].map(
                  (
                    item,
                    idx
                  ) => (

                    <button
                      key={idx}
                      onClick={() =>
                        sendMessage(
                          item.title
                        )
                      }
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 hover:border-teal-500/30 text-left transition-all group dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:border-slate-800/80"
                    >

                      <item.icon className="h-5 w-5 text-teal-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />

                      <div>

                        <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                          {
                            item.title
                          }
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {
                            item.desc
                          }
                        </div>

                      </div>

                    </button>

                  )
                )}

              </div>

            </div>

          ) : (

            <>

              {/* =================================================
                  MESSAGES
              ================================================= */}

              {messages.map((msg, i) => (
                <MessageRow
                  key={msg.id ?? `message-${i}`}
                  message={msg}
                  index={i}
                  isLastAssistant={
                    msg.role === "assistant" &&
                    i === messages.length - 1
                  }
                  loading={loading}
                  copiedIndex={copiedIndex}
                  onCopy={handleCopy}
                  onRetry={handleRetry}
                />
              ))}

              {/* =================================================
                  TOOL STATUS
              ================================================= */}

              {toolStatus && (

                <div className="flex items-center gap-3 ml-11 text-xs text-slate-400 animate-fade-in">

                  <div className="flex items-center gap-2 rounded-xl border border-teal-500/20 bg-slate-900/90 px-3.5 py-2 shadow-sm backdrop-blur-md">

                    <Search className="h-3.5 w-3.5 text-teal-400 animate-pulse" />

                    <span className="font-medium text-slate-300">
                      {
                        toolStatus
                      }
                    </span>

                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />

                  </div>

                </div>

              )}

            </>

          )}

          <div ref={bottomRef} />

        </div>

      </ScrollArea>

      {/* =================================================
          INPUT
      ================================================= */}

      <div className="shrink-0 z-50 p-4 bg-linear-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">

        <div className="mx-auto max-w-3xl">

          <div className="relative flex items-end rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-md focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/90">

            <Textarea
              ref={
                textareaRef
              }
              value={input}
              placeholder={
                placeholders[0]
              }
              onFocus={() =>
                bottomRef.current?.scrollIntoView(
                  {
                    behavior:
                      "smooth",
                  }
                )
              }
              onChange={
                handleInput
              }
              onKeyDown={
                onKeyDown
              }
              disabled={
                loading ||
                messages.length >=
                  chatLimit ||
                historyLoading
              }
              className="w-full min-h-13 max-h-32 resize-none border-0 bg-transparent py-3.5 pl-4 pr-14 text-base md:text-sm text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-slate-100"
              rows={1}
            />

            <div className="absolute right-2.5 bottom-2.5">

              <Button
                onClick={() =>
                  sendMessage()
                }
                disabled={
                  loading ||
                  !input.trim() ||
                  messages.length >=
                    chatLimit ||
                  historyLoading
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