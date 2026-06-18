

"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPinAreaIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

/* ---------------- TYPES ---------------- */

type AIUI = {
  type?: "place" | "activity" | "list" | "info";
  requestLocation: boolean
  title?: string;
  description?: string;

  categories?: string[];

  location?: {
    name: string;
    lat: number;
    lng: number;
  };



  links?: {
    website?: string;
    facebook?: string;
    instagram?: string;
  };

  shareLocation?: {
    lat?: number;
    lng?: number;
  };

  actions?: {
    type:
      | "map"
      | "link"
      | "whatsapp"
      | "booking"
      | "call"
      | "email"
      | "share-location"
      |"location-navigation";
    label: string;
    url?: string;
  }[];
  options?:{
name: string
description: string
contact: {
  phone: string,
  whatsapp: string
}
  }[],

  markdown?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  ui?: AIUI | null;
};

/* ---------------- PAGE ---------------- */

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function sendMessage(text?: string) {
   const messageText = text ?? input;

  if (!messageText.trim() || loading) return;

    const userMessage = messageText;

    // add user message immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversation: messages,
          island: "Guraidhoo",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          ui: data.ui || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
          ui: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="h-screen flex flex-col bg-background">

      {/* HEADER */}
      <div className="border-b p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Guraidhoo AI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask anything about the island
            </p>
          </div>
          <Badge variant="secondary">AI Beta</Badge>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="border-b p-3">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
          <Button variant="outline" size="sm" onClick={() => setInput("Cheap guesthouses")}>
            Cheap rooms
          </Button>

          <Button variant="outline" size="sm" onClick={() => setInput("Bike rentals")}>
            Rentals
          </Button>

          <Button variant="outline" size="sm" onClick={() => setInput("Things to do")}>
            Activities
          </Button>

          <Button variant="outline" size="sm" onClick={() => setInput("Restaurants")}>
            Food
          </Button>
        </div>
      </div>

      {/* CHAT AREA */}
      <ScrollArea className="flex-1 p-4 h-72">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length < 1?
          <div className="w-full min-h-130 flex flex-col items-center justify-center text-center px-6">
  <h1 className="text-2xl font-bold mb-3">
    👋 Welcome to Guraidhoo!
  </h1>

  <p className="max-w-xl text-sm text-muted-foreground leading-7 my-8">
    I'm here to help you discover places to stay, restaurants,
    activities, transport, and local attractions around the island.
  </p>

  <div className="mt-6 space-y-2 text-sm">
    <p className="font-medium">Try asking:</p>

    <div className="flex flex-col gap-2 text-muted-foreground">
      <span className=" cursor-pointer" onClick={(()=> sendMessage("Show me guesthouses"))}>🏨 "Show me guesthouses"</span>
      <span className=" cursor-pointer" onClick={(()=> sendMessage("Where can I eat?"))}>🍽️ "Where can I eat?"</span>
      <span className=" cursor-pointer" onClick={(()=> sendMessage("What activities are available?"))}>🤿 "What activities are available?"</span>
      <span className=" cursor-pointer" onClick={(()=> sendMessage("Can I rent a bike?"))}>🚲 "Can I rent a bike?"</span>
      <span className=" cursor-pointer" onClick={(()=> sendMessage("How do I get to Bikini Beach?"))}>📍 "How do I get to Bikini Beach?"</span>
    </div>
  </div>

  <p className="mt-6 text-sm font-medium">
    What would you like to explore today?
  </p>
</div>
          :
          <>
           {messages?.map((msg, i) => (
            <ChatBubble onLocationClick={((e)=>{
                  sendMessage(e);
            
            })} key={i} message={msg} />
          ))}
          </>
          }
         

          {/* LOADING */}
          {loading && (
            <div className="flex justify-start">
              <Card className="p-3 text-sm text-muted-foreground animate-pulse">
                Thinking...
              </Card>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <div className="border-t p-4 bg-background">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            placeholder="Ask about accommodation, food, rentals..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            disabled={loading}
          />

          <Button onClick={(()=> sendMessage())} disabled={loading}>
            {loading ? "Sending..." : "Send"}
            <RocketLaunchIcon className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CHAT BUBBLE ---------------- */

function ChatBubble({
  message,
  onLocationClick,
}: {
  message: Message;
  onLocationClick: (text: string) =>  void;
}) {
  const isUser = message.role === "user";

  return (
     <div className={`flex  ${isUser ? "justify-end" : "justify-start"}`}>
 
      <Card
        className={`p-3 max-w-[75%] text-sm space-y-3 ${
          isUser ? "bg-black text-white" : ""
        }`}
      >
        {/* USER MESSAGE */}
        {isUser && <div>{message.content}</div>}

        {/* ASSISTANT */}
        {!isUser && (
          <div className="space-y-3">
            {message.content && (<>
            <p>{message.content}</p>
<Separator /></>)}

            {/* TITLE */}
            {message.ui?.title && (
              <h2 className="font-bold text-base">
                {message.ui.title}
              </h2>
            )}

            {
              message?.ui?.options && message.ui.options?.length> 1 && message.ui.options.map((option, i)=>(
                <div key={i} className="flex flex-col">
                  <Separator className="my-2"/>
                  <p className="">{option?.name}</p>
                  <small className="text-muted-foreground my-2">
                    {option?.description}
                  </small>
                
                  {option?.contact?.phone &&(<Link className="my-1 hover:underline" href={`tel:${option?.contact?.phone}`}>Call: {option?.contact?.phone.split("+960")}</Link>)}


                  {option?.contact?.whatsapp &&(<Link className="my-1 hover:underline" href={`https://wa.me/${option?.contact?.whatsapp}`}>WhatsApp: {option?.contact?.whatsapp.split("+960")}</Link>)}


                </div>
              ))
            }

            {/* DESCRIPTION */}
            {message.ui?.description && (
              <p className="text-muted-foreground">
                {message.ui.description}
              </p>
            )}

            {/* CATEGORIES */}
            {message.ui?.categories && (
              <div className="flex flex-wrap gap-2">
                {message.ui.categories.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            {/* LOCATION MAP */}
            
            {
              message.ui?.requestLocation && (
                <>
               
                 <Button
  onClick={async () => {
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        toast.error(
          "Location access is blocked. Please enable it in your browser settings."
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          onLocationClick(`My location is ${lat},${lng}`);
        },
        (error) => {
          toast.error("Unable to get location");
        },
        {
          enableHighAccuracy: true,
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Location permission check failed");
    }
  }}
>
  Share Location <MapPinAreaIcon />
                </Button>
                </>
               
              )
            }


            {/* LINKS SECTION */}
            {message.ui?.links && (
              <div className="flex flex-wrap gap-2">

                {message.ui.links.website && (
                  <a href={message.ui.links.website} target="_blank">
                    <Button size="sm" variant="secondary">
                      🌐 Website
                    </Button>
                  </a>
                )}

                {message.ui.links.facebook && (
                  <a href={message.ui.links.facebook} target="_blank">
                    <Button size="sm" variant="secondary">
                      📘 Facebook
                    </Button>
                  </a>
                )}

                {message.ui.links.instagram && (
                  <a href={message.ui.links.instagram} target="_blank">
                    <Button size="sm" variant="secondary">
                      📸 Instagram
                    </Button>
                  </a>
                )}

              </div>
            )}

            {/* ACTIONS (generic buttons) */}
            {
            
            !message.ui?.requestLocation && (
            <>
            {
              message.ui?.actions?.map((a, i) => (
              
                <Button asChild key={i} size="sm" variant="outline" className="mr-2 mt-2">
                  <Link  href={a.url || ""} target="_blank">
                  {a.label}
                  </Link>
                </Button>
              
            ))
            }
            </>)
            
            }

            {/* MARKDOWN fallback */}
            {message.ui?.markdown && (
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                {message.ui.markdown} 
              </pre>
            )}

            {/* TEXT fallback */}
            
          </div>
          
        )}
      </Card>
    </div>
  );
}