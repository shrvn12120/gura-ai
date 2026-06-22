// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {  PaperPlaneRightIcon, Phone, WhatsappLogo, WhatsappLogoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { MapPin, PhoneCall } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from "sonner";

type CatalogOption = { 
  name: string; 
  description: string; 
  contact: { phone: string; whatsapp: string } ,
  location: {
    name: string
    lat: number
lng: number
googleMapsUrl: string
  }| null
};

type Message = {
  role: "user" | "assistant";
  content: string;
  hasCatalog: boolean;
  ui: {
    type: "place" | "activity" | "list" | "info";
    title: string;
    description: string;
    categories: string[];
    requestLocation: boolean;
    location?: { name: string; lat: number; lng: number } | null;
    links?: { website: string; facebook: string; instagram: string } | null;
    actions?: { type: string; label: string; url: string }[];
    options?: CatalogOption[];
  } | null;
};

// Robust partial JSON evaluator to parse keys out of a streaming payload safely
function parseStreamingJson(rawJson: string) {
  let message = "";
  let hasCatalog = false;
  let ui: any = null;

  // 1. Extract the conversational message dynamically before JSON closes
  const messageMatch = rawJson.match(/"message"\s*:\s*"(.*?[^\\])"/);
  if (messageMatch) {
    message = messageMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
  } else {
    const partialMessageMatch = rawJson.match(/"message"\s*:\s*"(.*)/);
    if (partialMessageMatch) {
      message = partialMessageMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/ text$/, '');
    }
  }

  // 2. Identify if the schema flag has catalog data attached
  if (rawJson.includes('"hasCatalog":true')) {
    hasCatalog = true;
  }

  // 3. Attempt a structural deep closing parse to render active objects/arrays early
  try {
    // Dynamically patch trailing closures depending on how far the stream has advanced
    let simulatedJson = rawJson.trim();
    if (!simulatedJson.endsWith("}")) {
      if (simulatedJson.includes('"ui":')) {
        simulatedJson += "}}";
      } else {
        simulatedJson += "}";
      }
    }
    const parsed = JSON.parse(simulatedJson);
    if (parsed.ui) ui = parsed.ui;
  } catch (e) {
    // Fallback regex scraping for titles while arrays are generating
    const titleMatch = rawJson.match(/"title"\s*:\s*"(.*?[^\\])"/);
    const descMatch = rawJson.match(/"description"\s*:\s*"(.*?[^\\])"/);
    const typeMatch = rawJson.match(/"type"\s*:\s*"(.*?)"/);
    
    if (titleMatch || descMatch || typeMatch) {
      ui = {
        type: typeMatch ? typeMatch[1] : "list",
        title: titleMatch ? titleMatch[1] : "Loading details...",
        description: descMatch ? descMatch[1] : "",
        categories: [],
        requestLocation: rawJson.includes('"requestLocation":true'),
        options: [],
        actions: []
      };
    }
  }

  return { message, hasCatalog, ui };
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
 const [iscatalogloading,setCatalogLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function sendMessage(text?: string) {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    setInput("");
    setLoading(true);

    // Push User message entry
    setMessages((prev) => [...prev, { role: "user", content: messageText, hasCatalog: false, ui: null }]);
    // Set placeholder frame for streaming assistant responses
    setMessages((prev) => [...prev, { role: "assistant", content: "", hasCatalog: false, ui: null }]);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, conversation: messages }),
      });

      if (!res.body) throw new Error("Empty response pipeline stream header");

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let accumulatedChunksString = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) setCatalogLoading(false)
        
        if (done) break;

        accumulatedChunksString += value;
        
        // Extract structural values incrementally out of the working raw JSON buffer
        const { message: parsedMessage, hasCatalog, ui } = parseStreamingJson(accumulatedChunksString);
        if(hasCatalog && !done){
          setCatalogLoading(true)
        }
      

        // Target solely the last index bubble to update content fields seamlessly
        setMessages((prev) => {
          const updated = [...prev];
          const target = updated[updated.length - 1];
          if (target && target.role === "assistant") {
            target.content = parsedMessage;
            target.hasCatalog = hasCatalog;
            target.ui = ui;
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Stream reader exception error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      <header className="border-b bg-background/90 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Guraidhoo Concierge
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Live Structured Streaming Engine</p>
          </div>
          <Badge variant="secondary" className="font-semibold text-xs rounded-full">⚡ Live Stream</Badge>
        </div>
      </header>

      {/* VIEWPORT CHAT CONSOLE */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length < 1 ? (
            <div className="w-full min-h-[70vh] flex flex-col items-center justify-end text-center py-12">
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                Welcome to Guraidhoo Island!
              </h1>
             <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                I can guide you through pristine beaches, local stay arrangements, booking speedboats, or locating active dining spots across the atoll.
              </p>
               <div className="w-full bg-background border rounded-2xl p-5 text-left shadow-sm space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Get started with a question
                </p>
                <div className="grid gap-2 text-sm">
                  {[
                    { label: "🏨 Show me guesthouses", text: "Show me guesthouses" },
                    { label: "🍽️ Where can I eat?", text: "Where can I eat?" },
                    { label: "🤿 Local activities & diving hubs", text: "What activities are available?" },
                    { label: "📍 How do I get to Bikini Beach?", text: "How do I get to Bikini Beach?" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.text)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border text-foreground/80 font-medium text-xs flex items-center justify-between group"
                    >
                      {item.label}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={idx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-2`}>
                    <Card className={`px-4 py-1 rounded-2xl shadow-sm text-sm border ${
                      isUser  ? "bg-primary text-primary-foreground border-transparent rounded-tr-none max-w-[80%]" 
                             : msg.content ? "bg-background text-foreground  rounded-tl-none max-w-[85%] md:max-w-[75%] space-y-4 py-4 border-primary/50 border-[0.1px]":"hidden"
                    }`}>
                      {/* 1. Conversational Chat Response */}
                      {msg.content &&  
                      <div className="leading-relaxed whitespace-pre-wrap ">
                        

                       <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: (props) => (
      <h1 {...props} className="text-xl font-bold mt-3 mb-2" />
    ),

    h2: (props) => (
      <h2 {...props} className="text-lg font-semibold mt-3 mb-2" />
    ),

    h3: (props) => (
      <h3 {...props} className="text-base font-semibold mt-2 mb-1" />
    ),

   p: ({ ...props }) => (
      <p {...props} className="leading-6" />
    ),

    ul: (props) => (
      <ul {...props} className="list-disc pl-5 " />
    ),

    ol: (props) => (
      <ol {...props} className="list-decimal pl-5 my-1" />
    ),

    li: (props) => (
      <li {...props} className="leading-0.1" />
    ),

    blockquote: (props) => (
      <blockquote
        {...props}
        className="border-l-2 pl-3 my-2 italic text-muted-foreground"
      />
    ),

    hr: () => (
      <hr className="my-2 border-border" />
    ),

    pre: (props) => (
      <pre
        {...props}
        className="my-2 overflow-x-auto rounded-md bg-muted p-3 text-sm"
      />
    ),

    code: ({ inline, children, ...props }: any) =>
      inline ? (
        <code
          {...props}
          className="bg-muted px-1 py-0.5 rounded text-sm"
        >
          {children}
        </code>
      ) : (
        <code {...props}>{children}</code>
      ),

    table: (props) => (
      <div className="overflow-x-auto my-2">
        <table {...props} className="w-full text-sm" />
      </div>
    ),

    a: (props) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      />
    ),
  }}
>
  {msg.content}
</ReactMarkdown>
                      </div>
                      
                      
                      }

                      {/* 2. Structured Catalog Interface Cards */}
                      {msg.ui && (
                        <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-muted/70 w-full animate-in fade-in-40 duration-300">
                          <div className="flex items-center justify-between">
                            <h2 className="font-bold text-base tracking-tight">{msg.ui.title}</h2>
                            {msg.ui.type && <Badge className="text-[10px] capitalize">{msg.ui.type}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{msg.ui.description}</p>
                          
                         
                          {msg.ui.options && msg.ui.options.length > 0 && (
                            <div className="space-y-2.5 mt-2">
                              {msg.ui.options.map((opt, i) => (
                                <div key={i} className="bg-background border rounded-xl p-3 space-y-2 shadow-xs">
                                  <p className="font-semibold text-sm">{opt.name}</p>
                                  <p className="text-xs text-muted-foreground leading-normal">{opt.description}</p>
                                  <div className="flex gap-3 text-xs pt-1">
                                    {opt.contact?.phone && (
                                      <Link className="text-blue-600 hover:underline flex items-center gap-1 font-medium" href={`tel:${opt.contact.phone}`}>
                                        <PhoneCall size={14} /> Call
                                      </Link>
                                    )}
                                    {opt.contact?.whatsapp && (
                                      <Link className="text-emerald-600 hover:underline flex items-center gap-1 font-medium" href={`https://wa.me/${opt.contact.whatsapp.replace(/[+\s]/g, "")}`} target="_blank">
                                        <WhatsappLogoIcon size={14} weight="fill" /> WhatsApp
                                      </Link>
                                    )}

                                    {opt.location && (
                                      <Link className="text-amber-600 hover:underline flex items-center gap-1 font-medium" href={opt.location.googleMapsUrl} target="_blank">
                                        <MapPin size={14}  /> See location
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                      
                          {msg.ui.actions && msg.ui.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {msg.ui.actions.map((act, i) => (
                                <div key={i}>
                                  {
                                    act.type === "share-location" ? (
                                       <Button 
                                       onClick={async () => {
                        try {
                          const permission = await navigator.permissions.query({ name: "geolocation" });
                          if (permission.state === "denied") {
                            toast.error("Location access blocked. Reset permissions in URL path.");
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              sendMessage(`My location is ${pos.coords.latitude},${pos.coords.longitude}`);
                            },
                            () => toast.error("Unable to securely pinpoint device location."),
                            { enableHighAccuracy: true }
                          );
                        } catch {
                          toast.error("Geolocation framework exception.");
                        }
                      }}
                                       size="sm" className="text-xs rounded-lg" >
                                  Share my location <MapPin />
                                </Button>
                                    ):(

                                       <Button  size="sm" variant={"secondary"} className="text-xs rounded-lg" asChild>
                                  <Link href={act.url || "#"} target={act.url ? "_blank" : "_self"}>
                                    {act.label}
                                  </Link>
                                </Button>
                                    )
                                  }
                               
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {
                        msg.hasCatalog && iscatalogloading && (<div  className="w-full min-h-72 bg-card/20 rounded-xl border animate-pulse "/>)
                      }
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {loading && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
               Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ENTRY SUBMISSION INTERFACE CONTROLLER */}
      <div className="border-t p-4 bg-background/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <Input
            value={input}
            placeholder="Search guesthouses, population details, dining coordinates..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            disabled={loading}
            className="h-11 rounded-xl bg-muted/40 focus-visible:bg-background border-muted-foreground/20 shadow-sm"
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="h-11 px-5 rounded-xl font-medium transition-all active:scale-95">
            <PaperPlaneRightIcon weight="bold" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}