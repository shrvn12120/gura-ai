// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Avatar } from "@/components/ui/avatar";
// import { Sparkles, ArrowUp, Edit } from "lucide-react";
// import Image from "next/image";

// import NoticeCarousel, { Notice, noticeStyles } from "./notice-carousel";

// import MarkdownMessage from "./markdown-message";

// import {
//   clearConversationId,
//   getConversationId,
//   getSessionId,
// } from "@/lib/session";
// import { getConversationHistory } from "@/app/action";
// import { MessageSkeleton } from "./message-skeleton";

// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };

// interface Props {
//   notices: Notice[];
// }

// export default function ChatUi({ notices }: Props) {
//   const [messages, setMessages] = useState<Message[]>([]);

//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [historyLoading, setHistoryLoading] = useState(false);

//   /*
//    * --------------------------------------------------
//    * Textarea
//    * --------------------------------------------------
//    */

//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   /*
//    * --------------------------------------------------
//    * Placeholder rotation
//    * --------------------------------------------------
//    */

//   const placeholderIndexRef = useRef(0);

//   const placeholders = [
//     "Guide me to my guesthouse.",
//     "Guíame hasta mi casa de...",
//     "带我去我的旅馆。",
//     "Проводите меня до моего го....",
//   ];

//   const chatHistory = async () => {
//     console.log("Called")
//     const chatId = getConversationId();
//     if (!chatId) {
//           console.log("no id")
//       return null;
//     } else {
//       setHistoryLoading(true);
//        console.log("Loading ")
//       const res = await getConversationHistory(chatId as string)
//       const history = JSON.parse(res);
//       setMessages(history);
//       setHistoryLoading(false);
//        console.log("Finished ")
//       return history;
//     }
//   };

//   useEffect(() => {
//     chatHistory();
//     const interval = setInterval(() => {
//       placeholderIndexRef.current =
//         (placeholderIndexRef.current + 1) % placeholders.length;

//       if (textareaRef.current) {
//         textareaRef.current.placeholder =
//           placeholders[placeholderIndexRef.current];
//       }
//     }, 5000);

//     return () => {
//       clearInterval(interval);
//     };
//   }, []);

//   /*
//    * --------------------------------------------------
//    * Auto scroll
//    * --------------------------------------------------
//    */

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, [messages]);

//   /*
//    * --------------------------------------------------
//    * Send message
//    * --------------------------------------------------
//    */

//   async function sendMessage() {
//     if (!input.trim() || loading) {
//       return;
//     }

//     const query = input.trim();

//     /*
//      * ------------------------------------------------
//      * Create UI messages
//      * ------------------------------------------------
//      */

//     const userMessage: Message = {
//       role: "user",
//       content: query,
//     };

//     const assistantPlaceholder: Message = {
//       role: "assistant",
//       content: "",
//     };

//     setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

//     setInput("");
//     setLoading(true);

//     try {
//       /*
//        * ------------------------------------------------
//        * Get IDs from localStorage
//        *
//        * IMPORTANT:
//        * Do this inside sendMessage().
//        *
//        * The conversation ID can change after the
//        * first request because the server creates it.
//        * ------------------------------------------------
//        */

//       const sessionId = getSessionId();

//       const conversationId = getConversationId();

//       /*
//        * ------------------------------------------------
//        * API request
//        * ------------------------------------------------
//        */

//       const res = await fetch("/api/chat", {
//         method: "POST",

//         headers: {
//           "Content-Type": "application/json",
//           Accept: "text/event-stream",
//         },

//         body: JSON.stringify({
//           sessionId,

//           conversationId: conversationId || null,

//           query,
//         }),
//       });

//       /*
//        * ------------------------------------------------
//        * Handle HTTP errors
//        * ------------------------------------------------
//        */

//       if (!res.ok) {
//         const errorText = await res.text();

//         console.error("API ERROR:", res.status, errorText);

//         throw new Error(`API request failed: ${res.status}`);
//       }

//       /*
//        * ------------------------------------------------
//        * Make sure we have a stream
//        * ------------------------------------------------
//        */

//       if (!res.body) {
//         throw new Error("No readable data stream available");
//       }

//       /*
//        * ------------------------------------------------
//        * Stream reader
//        * ------------------------------------------------
//        */

//       const reader = res.body.getReader();

//       const decoder = new TextDecoder();

//       /*
//        * ------------------------------------------------
//        * Streaming state
//        * ------------------------------------------------
//        */

//       let fullResponseText = "";

//       let buffer = "";

//       /*
//        * ------------------------------------------------
//        * Read stream
//        * ------------------------------------------------
//        */

//       while (true) {
//         const { value, done } = await reader.read();

//         if (done) {
//           break;
//         }

//         /*
//          * Decode incoming bytes
//          */

//         buffer += decoder.decode(value, {
//           stream: true,
//         });

//         /*
//          * SSE events are separated by:
//          *
//          * \n\n
//          */

//         const sseEvents = buffer.split("\n\n");

//         /*
//          * Keep the last incomplete event
//          * in the buffer.
//          */

//         buffer = sseEvents.pop() ?? "";

//         /*
//          * Process complete SSE events
//          */

//         for (const sseEvent of sseEvents) {
//           const lines = sseEvent.split("\n");

//           let eventType = "";
//           let data = "";

//           /*
//            * Parse SSE event
//            */

//           for (const line of lines) {
//             if (line.startsWith("event:")) {
//               eventType = line.slice(6).trim();
//             }

//             if (line.startsWith("data:")) {
//               data += line.slice(5).trim();
//             }
//           }

//           /*
//            * Nothing to process
//            */

//           if (!data) {
//             continue;
//           }

//           /*
//            * ------------------------------------------------
//            * Conversation event
//            * ------------------------------------------------
//            *
//            * Server sends:
//            *
//            * event: conversation
//            * data: {"conversationId":"conv_..."}
//            */
//           if (eventType === "conversation") {
//             try {
//               const parsed = JSON.parse(data);
//               if (parsed.conversationId) {
//                 localStorage.setItem("conversation_id", parsed.conversationId);
//               }
//             } catch (error) {
//               console.error("Conversation event parse error:", error);
//             }

//             continue;
//           }

//           /*
//            * ------------------------------------------------
//            * Text event
//            * ------------------------------------------------
//            *
//            * Server sends:
//            *
//            * event: text
//            * data: {"delta":"Hello"}
//            */

//           if (eventType === "text") {
//             try {
//               const parsed = JSON.parse(data);

//               if (typeof parsed.delta === "string") {
//                 fullResponseText += parsed.delta;

//                 /*
//                  * Update only the last
//                  * assistant message.
//                  */

//                 setMessages((prev) => {
//                   const copy = [...prev];

//                   if (copy.length > 0) {
//                     copy[copy.length - 1] = {
//                       role: "assistant",
//                       content: fullResponseText,
//                     };
//                   }

//                   return copy;
//                 });
//               }
//             } catch (error) {
//               console.error("Text event parse error:", error);
//             }

//             continue;
//           }

//           /*
//            * ------------------------------------------------
//            * Error event
//            * ------------------------------------------------
//            */

//           if (eventType === "error") {
//             try {
//               const parsed = JSON.parse(data);

//               throw new Error(parsed.message || "AI streaming error");
//             } catch (error) {
//               throw error;
//             }
//           }

//           /*
//            * ------------------------------------------------
//            * Done event
//            * ------------------------------------------------
//            */

//           if (eventType === "done") {
//             continue;
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Chat Error:", error);

//       /*
//        * Replace empty assistant message
//        * with an error message.
//        */

//       setMessages((prev) => {
//         const copy = [...prev];

//         if (copy.length > 0) {
//           copy[copy.length - 1] = {
//             role: "assistant",
//             content:
//               "Something went wrong while connecting to AI. Please try again.",
//           };
//         }

//         return copy;
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   /*
//    * --------------------------------------------------
//    * Keyboard
//    * --------------------------------------------------
//    */

//   function onKeyDown(e: React.KeyboardEvent) {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();

//       sendMessage();
//     }
//   }

//   /*
//    * --------------------------------------------------
//    * UI
//    * --------------------------------------------------
//    */
//   return (
//     <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
//       {/* ---------------------------------------------- */}
//       {/* HEADER */}
//       {/* ---------------------------------------------- */}

//       <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
//         <div className="flex items-center gap-2.5 mx-auto w-full max-w-2xl">
//           <Avatar className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm">
//             <Image
//               alt="Logo"
//               src="/web-app-manifest-512x512.png"
//               width={100}
//               height={100}
//               className="rounded-md"
//             />
//           </Avatar>

//           <div>
//             <h1 className="text-sm font-semibold tracking-tight">
//               Explore guraidhoo | Chat
//             </h1>

//             {notices?.length >= 1 ? (
//               <p
//                 className={`text-[11px] font-medium flex items-center gap-1 ${
//                   noticeStyles[notices[0].type].text
//                 }`}
//               >
//                 <span
//                   className={`h-1.5 w-1.5 rounded-full ${
//                     noticeStyles[notices[0].type].color
//                   } animate-pulse`}
//                 />
//                 There is active {notices[0].type}. Check it out!
//               </p>
//             ) : (
//               <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 Island Expert Online
//               </p>
//             )}
//           </div>
//         </div>
//         {messages.length >= 1 && (
//           <Button
//             onClick={() => {
//               clearConversationId();
//               window.location.reload();
//             }}
//             variant={"outline"}
//             size={"sm"}
//           >
//             <Edit /> New Chat
//           </Button>
//         )}
//       </header>

//       {/* ---------------------------------------------- */}
//       {/* MESSAGE AREA */}
//       {/* ---------------------------------------------- */}

//       <ScrollArea className="flex-1">
//         <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
//           {/* ------------------------------------------ */}
//           {/* EMPTY STATE */}
//           {/* ------------------------------------------ */}

//           {/* ------------------------------------------ */}
//           {/* MESSAGE FEED */}
//           {/* ------------------------------------------ */}
//           {historyLoading ? (
//             <MessageSkeleton />
//           ) : (
//             <>
//           {messages.length === 0 && (
//             <div className="w-full flex flex-col items-center justify-center text-center pt-20 space-y-4 min-h-96">
//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 dark:text-zinc-600">
//                 <Sparkles className="h-5 w-5" />
//               </div>

//               <div className="space-y-1 w-full">
//                 {notices?.length >= 1 ? (
//                   <div className="w-full">
//                     <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-8">
//                       Announcements
//                     </h2>

//                     <NoticeCarousel notices={notices} />
//                   </div>
//                 ) : (
//                   <>
//                     <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200">
//                       Welcome to Guraidhoo
//                     </h2>

//                     <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
//                       Ask me about local guest houses, speedboats schedules,
//                       bikini beaches, or hidden local dining spots.
//                     </p>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}

//               {messages.map((msg, i) => (
//                 <div
//                   key={i}
//                   className={`flex items-start gap-4 ${
//                     msg.role === "user" ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   {msg.role === "assistant" && (
//                     <Avatar className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 shadow-sm text-xs">
//                       GAI
//                     </Avatar>
//                   )}

//                   {msg.role === "user" ? (
//                     <div className="max-w-[85%] rounded-2xl bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50 selection:bg-zinc-700">
//                       <p className="leading-relaxed whitespace-pre-wrap">
//                         {msg.content}
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
//                       <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-7 font-normal selection:bg-cyan-500/20">
//                         {msg.content ? (
//                           <MarkdownMessage content={msg.content} />
//                         ) : (
//                           loading &&
//                           i === messages.length - 1 && (
//                             <div className="flex items-center gap-1.5 py-1 text-zinc-400 dark:text-zinc-500 text-sm">
//                               <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.3s]" />

//                               <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.15s]" />

//                               <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" />
//                             </div>
//                           )
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </>
//           )}

//           <div ref={bottomRef} />
//         </div>
//       </ScrollArea>

//       {/* ---------------------------------------------- */}
//       {/* INPUT */}
//       {/* ---------------------------------------------- */}

//       <div className="pb-6 pt-2 px-4 bg-linear-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90">
//         <div className="mx-auto max-w-2xl relative flex items-end rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-700 transition-all duration-200">
//           <Textarea
//             ref={(el) => {
//               textareaRef.current = el;
//             }}
//             value={input}
//             placeholder={placeholders[0]}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={onKeyDown}
//             className="w-full min-h-13 max-h-32 resize-none border-0 bg-transparent py-4 pl-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
//             rows={1}
//           />

//           <div className="absolute right-2.5 bottom-2.5">
//             <Button
//               onClick={sendMessage}
//               disabled={loading || !input.trim()}
//               size="icon"
//               className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 transition-all disabled:opacity-30"
//             >
//               <ArrowUp className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>

//         <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 tracking-wide">
//           Local tips reflect real-time seasonal dynamic shifts on K. Guraidhoo.
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles, ArrowUp, Edit, Link2 } from "lucide-react";
import Image from "next/image";

import NoticeCarousel, { Notice, noticeStyles } from "./notice-carousel";
import MarkdownMessage from "./markdown-message";
import {
  clearConversationId,
  getConversationId,
  getSessionId,
} from "@/lib/session";
import { getConversationHistory } from "@/app/action";
import { MessageSkeleton } from "./message-skeleton";
import { Spinner } from "./ui/spinner";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface Props {
  notices: Notice[];
}

export default function ChatUi({ notices }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Initialize historyLoading as true so it doesn't flash the empty state
  const [historyLoading, setHistoryLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const placeholderIndexRef = useRef(0);

  const placeholders = [
    "Guide me to my guesthouse.",
    "Guíame hasta mi casa de...",
    "带我去我的旅馆。",
    "Проводите меня до моего го....",
  ];

  /*
   * --------------------------------------------------
   * Load Chat History
   * --------------------------------------------------
   */
  const loadChatHistory = useCallback(async () => {
    const chatId = getConversationId();

    if (!chatId) {
      setHistoryLoading(false);
      return;
    }

    try {
      setHistoryLoading(true);
      const res = await getConversationHistory(chatId as string);

      if (res) {
        const history = typeof res === "string" ? JSON.parse(res) : res;
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to fetch conversation history:", error);
    } finally {
      // Guaranteed to run whether request succeeds or fails
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();

    const interval = setInterval(() => {
      placeholderIndexRef.current =
        (placeholderIndexRef.current + 1) % placeholders.length;

      if (textareaRef.current) {
        textareaRef.current.placeholder =
          placeholders[placeholderIndexRef.current];
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadChatHistory]);

  /*
   * --------------------------------------------------
   * Auto scroll
   * --------------------------------------------------
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * --------------------------------------------------
   * Send message
   * --------------------------------------------------
   */
  async function sendMessage() {
    if (!input.trim() || loading) return;

    const query = input.trim();

    const userMessage: Message = { role: "user", content: query };
    const assistantPlaceholder: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setLoading(true);

    try {
      const sessionId = getSessionId();
      const conversationId = getConversationId();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          sessionId,
          conversationId: conversationId || null,
          query,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API ERROR:", res.status, errorText);
        throw new Error(`API request failed: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No readable data stream available");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const sseEvents = buffer.split("\n\n");
        buffer = sseEvents.pop() ?? "";

        for (const sseEvent of sseEvents) {
          const lines = sseEvent.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            }
            if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
          }

          if (!data) continue;

          if (eventType === "conversation") {
            try {
              const parsed = JSON.parse(data);
              if (parsed.conversationId) {
                localStorage.setItem("conversation_id", parsed.conversationId);
              }
            } catch (error) {
              console.error("Conversation event parse error:", error);
            }
            continue;
          }

          if (eventType === "text") {
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed.delta === "string") {
                fullResponseText += parsed.delta;
                setMessages((prev) => {
                  const copy = [...prev];
                  if (copy.length > 0) {
                    copy[copy.length - 1] = {
                      role: "assistant",
                      content: fullResponseText,
                    };
                  }
                  return copy;
                });
              }
            } catch (error) {
              console.error("Text event parse error:", error);
            }
            continue;
          }

          if (eventType === "error") {
            const parsed = JSON.parse(data);
            throw new Error(parsed.message || "AI streaming error");
          }
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = {
            role: "assistant",
            content:
              "Something went wrong while connecting to AI. Please try again.",
          };
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5 mx-auto w-full max-w-2xl">
          <Avatar className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Image
              alt="Logo"
              src="/web-app-manifest-512x512.png"
              width={100}
              height={100}
              className="rounded-md"
            />
          </Avatar>

          <div>
            <h1 className="text-sm font-semibold tracking-tight">
              Explore guraidhoo | Chat
            </h1>

            {notices?.length >= 1 ? (
              <p
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  noticeStyles[notices[0].type].text
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    noticeStyles[notices[0].type].color
                  } animate-pulse`}
                />
                There is active {notices[0].type}.
                <Link
                  className="underline opacity-100 text-accent-foreground"
                  href={"/notice"}
                >
                  Check it out !
                </Link>
              </p>
            ) : (
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Island Expert Online
              </p>
            )}
          </div>
        </div>

        <Button
          disabled={historyLoading}
          onClick={() => {
            clearConversationId();
            window.location.reload();
          }}
          variant="outline"
          className="text-primary"
          size="sm"
        >
          {historyLoading ? (
            <Spinner className="h-4 w-4 mr-1" />
          ) : (
            <Edit className="h-4 w-4 mr-1" />
          )}{" "}
          New Chat
        </Button>
      </header>

      {/* MESSAGE AREA */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
          {/* 1. SHOW SKELETON FIRST WHEN LOADING HISTORY */}
          {historyLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            /* 2. SHOW EMPTY STATE WHEN HISTORY IS CLEARED OR EMPTY */
            <div className="w-full flex flex-col items-center justify-center text-center pt-20 space-y-4 min-h-96">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 dark:text-zinc-600">
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="space-y-1 w-full">
                {notices?.length >= 1 ? (
                  <div className="w-full">
                    <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-8">
                      Announcements
                    </h2>
                    <NoticeCarousel notices={notices} />
                  </div>
                ) : (
                  <>
                    <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200">
                      Welcome to Guraidhoo
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                      Ask me about local guest houses, speedboats schedules,
                      bikini beaches, or hidden local dining spots.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* 3. RENDER MESSAGES WHEN LOADED AND NOT EMPTY */
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 shadow-sm text-xs">
                    GAI
                  </Avatar>
                )}

                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50 selection:bg-zinc-700">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
                    <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-7 font-normal selection:bg-cyan-500/20">
                      {msg.content ? (
                        <MarkdownMessage content={msg.content} />
                      ) : (
                        loading &&
                        i === messages.length - 1 && (
                          <div className="flex items-center gap-1.5 py-1 text-zinc-400 dark:text-zinc-500 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <div className="pb-6 pt-2 px-4 bg-linear-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90">
        <div className="mx-auto max-w-2xl relative flex items-end rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-700 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={input}
            placeholder={placeholders[0]}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full min-h-13 max-h-32 resize-none border-0 bg-transparent py-4 pl-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={1}
          />

          <div className="absolute right-2.5 bottom-2.5">
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 transition-all disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 tracking-wide">
          Local tips reflect real-time seasonal dynamic shifts on K. Guraidhoo.
        </p>
      </div>
    </div>
  );
}
