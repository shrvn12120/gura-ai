
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Avatar } from "@/components/ui/avatar";
// import { Sparkles, ArrowUp, Compass } from "lucide-react";
// import Image from "next/image";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import NoticeCarousel, { Notice } from "./notice-carousel";

// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };
// interface Props {
//     notices: Notice[]}

// export default function ChatUi({notices}:Props) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [placeHolder, setPlaceHolder] = useState("Guide me to my guesthouse.")
//   const placeholders = [
//     "Guide me to my guesthouse.",
//     "Guíame hasta mi casa de huéspedes.",
//     "带我去我的旅馆。",
//     "Проводите меня до моего гостевого дома."]

// useEffect(() => {
//   let index = 0;

//   const interval = setInterval(() => {
//     index = (index + 1) % placeholders.length;
//     setPlaceHolder(placeholders[index]);
//   }, 5000);

//   return () => clearInterval(interval);
// }, []);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   async function sendMessage() {
//     if (!input.trim() || loading) return;

//     const userMessage: Message = {
//       role: "user",
//       content: input,
//     };

//     const assistantPlaceholder: Message = {
//       role: "assistant",
//       content: "",
//     };

//     const updatedMessagesPayload = [...messages, userMessage];

//     setMessages([...updatedMessagesPayload, assistantPlaceholder]);
//     setInput("");
//     setLoading(true);

//     try {
//       const res = await fetch("/api/search", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           messages: updatedMessagesPayload,
//         }),
//       });

//       if (!res.ok) throw new Error("Network connection error");
//       if (!res.body) throw new Error("No readable data stream available");

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder();

//       let fullResponseText = "";

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;

//         fullResponseText += decoder.decode(value, { stream: true });

//         setMessages((prev) => {
//           const copy = [...prev];
//           if (copy.length > 0) {
//             copy[copy.length - 1] = {
//               role: "assistant",
//               content: fullResponseText,
//             };
//           }
//           return copy;
//         });
//       }
//     } catch (err) {
//       console.error("Chat Error:", err);
//       setMessages((prev) => {
//         const copy = [...prev];
//         if (copy.length > 0) {
//           copy[copy.length - 1] = {
//             role: "assistant",
//             content: "Something went wrong while connecting to Ai. Please try again.",
//           };
//         }
//         return copy;
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   function onKeyDown(e: React.KeyboardEvent) {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   }

//   return (
//     <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
//       {/* HEADER */}
//       <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
//         <div className="flex items-center gap-2.5 mx-auto w-full max-w-2xl">
//           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
//             <Compass className="h-5 w-5" />
//           </div>
//           <div>
//             <h1 className="text-sm font-semibold tracking-tight">Explore guraidhoo | Chat</h1>
//             <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//               Island Expert Online
//             </p>
//           </div>
//         </div>
//       </header>

//       {/* MESSAGES LAYER */}
//       <ScrollArea className="flex-1">
//         <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
//           {/* EMPTY STATE */}
//           {messages.length === 0 && (
//             <div>

           

            

//             <div className="w-full flex flex-col items-center justify-center text-center pt-20 space-y-4  min-h-96">
//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 dark:text-zinc-600">
//                 <Sparkles className="h-5 w-5" />
//               </div>
//               <div className="space-y-1 w-full">
                
               
//             {
//                 notices?.length >= 1 ?(
// <div className="w-full ">
//     <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-8">Announcments</h2>

// <NoticeCarousel notices={notices}/>
// </div>
//                 ): <>
//                 <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200">Welcome to Guraidhoo</h2>
//                 <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
//                   Ask me about local guest houses, speedboats schedules, bikini beaches, or hidden local dining spots.
//                 </p> 
//                 </> 
                
//             }
//               </div>
//             </div>


//             </div>
//           )}

//           {/* MESSAGE FEED */}
//           {messages.map((msg, i) => (
//             <div
//               key={i}
//               className={`flex items-start gap-4 ${
//                 msg.role === "user" ? "justify-end" : "justify-start"
//               }`}
//             >
//               {/* AI Avatar */}
//               {msg.role === "assistant" && (
//                 <Avatar  className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm">
//                   {/* <Sparkles className="h-4 w-4" /> */}
//                   <Image alt="Logo" src={"/favicon.svg"} width={100} height={100} className="rounded-md"/> 
//                 </Avatar>
//               )}

//               {/* Message Layouts */}
//               {msg.role === "user" ? (
//                 <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-zinc-50 shadow-sm dark:bg-zinc-200 dark:text-zinc-950 selection:bg-zinc-700">
//                   <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
//                 </div>
//               ) : (
//                 <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
//                   <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-7 font-normal selection:bg-cyan-500/20">
//                     {msg.content ? (
//                       <ReactMarkdown 
//                         remarkPlugins={[remarkGfm]}
//                         components={{
//                           // UI-friendly styles mapping for raw elements
//                          a: ({ href, children }) => {
//       // Check if it's a telephone link or external URL
//       const isTelOrMail = href?.startsWith('tel:') || href?.startsWith('mailto:');
//       return (
//         <a 
//           href={href} 
//           className="text-cyan-600 dark:text-cyan-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
//           // Keep tel/mailto default behavior, open others in a new tab safely
//           target={isTelOrMail ? undefined : "_blank"}
//           rel={isTelOrMail ? undefined : "noopener noreferrer"}
//         >
//           {children}
//         </a>
//       );
//     },
//     img: ({ src, alt }) => {
//   if (!src) return null;

//   return (
//     <span className="block my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
//       <Image
//         src={src.toString()}
//         alt={alt || "Image"}
//         width={1200}
//         height={800}
//         className="h-auto w-full object-cover"
//         sizes="(max-width: 768px) 100vw, 700px"
//         unoptimized={false}
//       />
//       {alt && (
//         <span className=" capitalize border-t  px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
//           {alt}
//         </span>
//       )}
//     </span>
//   );
// },
//                           p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
//                           strong: ({ children }) => <strong className="font-semibold text-zinc-950 dark:text-white">{children}</strong>,
//                           ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
//                           ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
//                           li: ({ children }) => <li className="leading-relaxed">{children}</li>,
//                           h1: ({ children }) => <h1 className="text-lg font-bold tracking-tight mb-2 mt-4 text-zinc-950 dark:text-white">{children}</h1>,
//                           h2: ({ children }) => <h2 className="text-md font-semibold tracking-tight mb-2 mt-3 text-zinc-950 dark:text-white">{children}</h2>,
//                           h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 text-zinc-950 dark:text-white">{children}</h3>,
//                           blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">{children}</blockquote>,
//                           table: ({ children }) => (
//                             <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
//                               <table className="w-full text-left text-xs border-collapse">{children}</table>
//                             </div>
//                           ),
//                           thead: ({ children }) => <thead className="bg-zinc-100 dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
//                           tbody: ({ children }) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</tbody>,
//                           tr: ({ children }) => <tr>{children}</tr>,
//                           th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
//                           td: ({ children }) => <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{children}</td>,
//                         }}
//                       >
//                         {msg.content}
//                       </ReactMarkdown>
//                     ) : (
//                       loading && i === messages.length - 1 && (
//                         <div className="flex items-center gap-1.5 py-1 text-zinc-400 dark:text-zinc-500 text-sm">
//                           <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.3s]" />
//                           <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.15s]" />
//                           <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" />
//                         </div>
//                       )
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//           <div ref={bottomRef} />
//         </div>
//       </ScrollArea>

//       {/* INPUT CONTROLS */}
//       <div className="pb-6 pt-2 px-4 bg-linear-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90">
//         <div className="mx-auto max-w-2xl relative flex items-end rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-700 transition-all duration-200">
//           <Textarea
//             value={input}
//             placeholder={placeHolder}
          
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

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles, ArrowUp, Compass } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NoticeCarousel, { Notice } from "./notice-carousel";

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

  // 1. References to track placeholders without forcing component cycles
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholderIndexRef = useRef(0);
  const placeholders = [
    "Guide me to my guesthouse.",
    "Guíame hasta mi casa de...",
    "带我去我的旅馆。",
    "Проводите меня до моего го....",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // Advance index internally
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % placeholders.length;
      
      // 2. Direct DOM manipulation avoids structural React tree updates
      if (textareaRef.current) {
        textareaRef.current.placeholder = placeholders[placeholderIndexRef.current];
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const assistantPlaceholder: Message = {
      role: "assistant",
      content: "",
    };

    const updatedMessagesPayload = [...messages, userMessage];

    setMessages([...updatedMessagesPayload, assistantPlaceholder]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessagesPayload,
        }),
      });

      if (!res.ok) throw new Error("Network connection error");
      if (!res.body) throw new Error("No readable data stream available");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let fullResponseText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        fullResponseText += decoder.decode(value, { stream: true });

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
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Something went wrong while connecting to Ai. Please try again.",
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Explore guraidhoo | Chat</h1>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Island Expert Online
            </p>
          </div>
        </div>
      </header>

      {/* MESSAGES LAYER */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
          {/* EMPTY STATE */}
          {messages.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center text-center pt-20 space-y-4 min-h-96">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-400 dark:text-zinc-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1 w-full">
                {notices?.length >= 1 ? (
                  <div className="w-full">
                    <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-8">Announcements</h2>
                    <NoticeCarousel notices={notices} />
                  </div>
                ) : (
                  <>
                    <h2 className="text-md font-medium text-zinc-800 dark:text-zinc-200">Welcome to Guraidhoo</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                      Ask me about local guest houses, speedboats schedules, bikini beaches, or hidden local dining spots.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* MESSAGE FEED */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm">
                  <Image alt="Logo" src={"/favicon.svg"} width={100} height={100} className="rounded-md" />
                </Avatar>
              )}

              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-zinc-50 shadow-sm dark:bg-zinc-200 dark:text-zinc-950 selection:bg-zinc-700">
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[85%] space-y-2 pt-0.5 w-full">
                  <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-7 font-normal selection:bg-cyan-500/20">
                    {msg.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => {
                            const isTelOrMail = href?.startsWith('tel:') || href?.startsWith('mailto:');
                            return (
                              <a
                                href={href}
                                className="text-cyan-600 dark:text-cyan-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
                                target={isTelOrMail ? undefined : "_blank"}
                                rel={isTelOrMail ? undefined : "noopener noreferrer"}
                              >
                                {children}
                              </a>
                            );
                          },
                          img: ({ src, alt }) => {
                            if (!src) return null;
                            return (
                              <span className="block my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Image
                                  src={src.toString()}
                                  alt={alt || "Image"}
                                  width={1200}
                                  height={800}
                                  className="h-auto w-full object-cover"
                                  sizes="(max-width: 768px) 100vw, 700px"
                                />
                                {alt && (
                                  <span className="capitalize border-t px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    {alt}
                                  </span>
                                )}
                              </span>
                            );
                          },
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-zinc-950 dark:text-white">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold tracking-tight mb-2 mt-4 text-zinc-950 dark:text-white">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-md font-semibold tracking-tight mb-2 mt-3 text-zinc-950 dark:text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 text-zinc-950 dark:text-white">{children}</h3>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">{children}</blockquote>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <table className="w-full text-left text-xs border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-zinc-100 dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</tbody>,
                          tr: ({ children }) => <tr>{children}</tr>,
                          th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      loading && i === messages.length - 1 && (
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
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT CONTROLS */}
      <div className="pb-6 pt-2 px-4 bg-linear-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90">
        <div className="mx-auto max-w-2xl relative flex items-end rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-700 transition-all duration-200">
          <Textarea
            ref={(el) => {
              // 3. Merges custom forward reference to keep native binding access active
              textareaRef.current = el;
            }}
            value={input}
            placeholder={placeholders[0]} // Set fallback initial value on build
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