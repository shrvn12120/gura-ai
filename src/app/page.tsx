

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
// import { MapPinAreaIcon, RocketLaunchIcon } from "@phosphor-icons/react";
// import { toast } from "sonner";
// import Link from "next/link";
// import { Separator } from "@/components/ui/separator";
// import AiThinkingLoader from "@/components/ai-loading";

// /* ---------------- TYPES ---------------- */

// type AIUI = {
//   type?: "place" | "activity" | "list" | "info";
//   requestLocation: boolean
//   title?: string;
//   description?: string;

//   categories?: string[];

//   location?: {
//     name: string;
//     lat: number;
//     lng: number;
//   };



//   links?: {
//     website?: string;
//     facebook?: string;
//     instagram?: string;
//   };

//   shareLocation?: {
//     lat?: number;
//     lng?: number;
//   };

//   actions?: {
//     type:
//       | "map"
//       | "link"
//       | "whatsapp"
//       | "booking"
//       | "call"
//       | "email"
//       | "share-location"
//       |"location-navigation";
//     label: string;
//     url?: string;
//     a?: string
//   }[];
//   options?:{
// name: string
// description: string
// contact: {
//   phone: string,
//   whatsapp: string
// }
//   }[],

//   markdown?: string;
// };

// type Message = {
//   role: "user" | "assistant";
//   content: string;
//   ui?: AIUI | null;
// };

// /* ---------------- PAGE ---------------- */

// export default function AIChatPage() {
//   const [messages, setMessages] = useState<Message[]>([]);

//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   async function sendMessage(text?: string) {
//    const messageText = text ?? input;

//   if (!messageText.trim() || loading) return;

//     const userMessage = messageText;

//     // add user message immediately
//     setMessages((prev) => [
//       ...prev,
//       { role: "user", content: userMessage },
//     ]);

//     setInput("");
//     setLoading(true);

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: userMessage,
//           conversation: messages,
//           island: "Guraidhoo",
//         }),
//       });

//       const data = await res.json();

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.message,
//           ui: data.ui || null,
//         },
//       ]);
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "⚠️ Something went wrong. Please try again.",
//           ui: null,
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   return (
//     <div className="h-screen flex flex-col bg-background">

//       {/* HEADER */}
//       <div className="border-b p-4">
//         <div className="max-w-3xl mx-auto flex items-center justify-between">
//           <div>
//             <h1 className="text-lg font-bold">Guraidhoo AI Assistant</h1>
//             <p className="text-sm text-muted-foreground">
//               Ask anything about the island
//             </p>
//           </div>
//           <Badge variant="secondary">AI Beta</Badge>
//         </div>
//       </div>

//       {/* QUICK ACTIONS */}
//       <div className="border-b p-3">
//         <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
//           <Button variant="outline" size="sm" onClick={() => setInput("Cheap guesthouses")}>
//             Cheap rooms
//           </Button>

//           <Button variant="outline" size="sm" onClick={() => setInput("Bike rentals")}>
//             Rentals
//           </Button>

//           <Button variant="outline" size="sm" onClick={() => setInput("Things to do")}>
//             Activities
//           </Button>

//           <Button variant="outline" size="sm" onClick={() => setInput("Restaurants")}>
//             Food
//           </Button>
//         </div>
//       </div>

//       {/* CHAT AREA */}
//       <ScrollArea className="flex-1 p-4 h-72">
//         <div className="max-w-3xl mx-auto space-y-3">
//           {messages.length < 1?
//           <div className="w-full min-h-130 flex flex-col items-center justify-center text-center px-6">
//   <h1 className="text-2xl font-bold mb-3">
//     👋 Welcome to Guraidhoo!
//   </h1>

//   <p className="max-w-xl text-sm text-muted-foreground leading-7 my-8">
//     I'm here to help you discover places to stay, restaurants,
//     activities, transport, and local attractions around the island.
//   </p>

//   <div className="mt-6 space-y-2 text-sm">
//     <p className="font-medium">Try asking:</p>

//     <div className="flex flex-col gap-2 text-muted-foreground">
//       <span className=" cursor-pointer" onClick={(()=> sendMessage("Show me guesthouses"))}>🏨 "Show me guesthouses"</span>
//       <span className=" cursor-pointer" onClick={(()=> sendMessage("Where can I eat?"))}>🍽️ "Where can I eat?"</span>
//       <span className=" cursor-pointer" onClick={(()=> sendMessage("What activities are available?"))}>🤿 "What activities are available?"</span>
//       <span className=" cursor-pointer" onClick={(()=> sendMessage("Can I rent a bike?"))}>🚲 "Can I rent a bike?"</span>
//       <span className=" cursor-pointer" onClick={(()=> sendMessage("How do I get to Bikini Beach?"))}>📍 "How do I get to Bikini Beach?"</span>
//     </div>
//   </div>

//   <p className="mt-6 text-sm font-medium">
//     What would you like to explore today?
//   </p>
// </div>
//           :
//           <>
//            {messages?.map((msg, i) => (
//             <ChatBubble onLocationClick={((e)=>{
//                   sendMessage(e);
            
//             })} key={i} message={msg} />
//           ))}
//           </>
//           }
         

//           {/* LOADING */}
//           {loading && (
//             <div className="flex justify-start">
//               {/* <Card className="p-3 text-sm text-muted-foreground animate-pulse">
//                 Thinking...
//               </Card> */}
//               <AiThinkingLoader />
//             </div>
//           )}

//           <div ref={bottomRef} />
//         </div>
//       </ScrollArea>

//       {/* INPUT */}
//       <div className="border-t p-4 bg-background">
//         <div className="max-w-3xl mx-auto flex gap-2">
//           <Input
//             value={input}
//             placeholder="Ask about accommodation, food, rentals..."
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") sendMessage();
//             }}
//             disabled={loading}
//           />

//           <Button onClick={(()=> sendMessage())} disabled={loading}>
//             {loading ? "Sending..." : "Send"}
//             <RocketLaunchIcon className="ml-2" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------------- CHAT BUBBLE ---------------- */

// function ChatBubble({
//   message,
//   onLocationClick,
// }: {
//   message: Message;
//   onLocationClick: (text: string) =>  void;
// }) {
//   const isUser = message.role === "user";

//   return (
//      <div className={`flex  ${isUser ? "justify-end" : "justify-start"}`}>
 
//       <Card
//         className={`p-3 max-w-[75%] text-sm space-y-3 ${
//           isUser ? "bg-black text-white" : ""
//         }`}
//       >
//         {/* USER MESSAGE */}
//         {isUser && <div>{message.content}</div>}

//         {/* ASSISTANT */}
//         {!isUser && (
//           <div className="space-y-3">
//             {message.content && message?.ui?.type !=="list" && (<>
//             <p>{message.content}</p>
// <Separator /></>)}

//             {/* TITLE */}
//             {message.ui?.title && (
//               <h2 className="font-bold text-base">
//                 {message.ui.title}
//               </h2>
//             )}
// {/* DESCRIPTION */}
//             {message.ui?.description && (
//               <p className="text-muted-foreground">
//                 {message.ui.description}
//               </p>
//             )}
//             {
//               message?.ui?.options && message.ui.options.map((option, i)=>(
//                 <div key={i} className="flex flex-col">
//                   <Separator className="my-2"/>
//                   <p className="">{option?.name}</p>
//                   <small className="text-muted-foreground my-2">
//                     {option?.description}
//                   </small>
                
//                   {option?.contact?.phone &&(<Link className="my-1 hover:underline" href={`tel:${option?.contact?.phone}`}>Call: {option?.contact?.phone.split("+960")}</Link>)}


//                   {option?.contact?.whatsapp &&(<Link className="my-1 hover:underline" href={`https://wa.me/${option?.contact?.whatsapp}`}>WhatsApp: {option?.contact?.whatsapp.split("+960")}</Link>)}


//                 </div>
//               ))
//             }

            

//             {/* CATEGORIES */}
//             {message.ui?.categories && (
//               <div className="flex flex-wrap gap-2">
//                 {message.ui.categories.map((c) => (
//                   <Badge key={c} variant="secondary">
//                     {c}
//                   </Badge>
//                 ))}
//               </div>
//             )}

//             {/* LOCATION MAP */}
            
//             {
//               message.ui?.requestLocation && (
//                 <>
               
//                  <Button
//   onClick={async () => {
//     try {
//       const permission = await navigator.permissions.query({
//         name: "geolocation",
//       });

//       if (permission.state === "denied") {
//         toast.error(
//           "Location access is blocked. Please enable it in your browser settings."
//         );
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const lat = position.coords.latitude;
//           const lng = position.coords.longitude;

//           onLocationClick(`My location is ${lat},${lng}`);
//         },
//         (error) => {
//           toast.error("Unable to get location");
//         },
//         {
//           enableHighAccuracy: true,
//         }
//       );
//     } catch (error) {
//       console.error(error);
//       toast.error("Location permission check failed");
//     }
//   }}
// >
//   Share Location <MapPinAreaIcon />
//                 </Button>
//                 </>
               
//               )
//             }


//             {/* LINKS SECTION */}
//             {message.ui?.links && (
//               <div className="flex flex-wrap gap-2">

//                 {message.ui.links.website && (
//                   <a href={message.ui.links.website} target="_blank">
//                     <Button size="sm" variant="secondary">
//                       🌐 Website
//                     </Button>
//                   </a>
//                 )}

//                 {message.ui.links.facebook && (
//                   <a href={message.ui.links.facebook} target="_blank">
//                     <Button size="sm" variant="secondary">
//                       📘 Facebook
//                     </Button>
//                   </a>
//                 )}

//                 {message.ui.links.instagram && (
//                   <a href={message.ui.links.instagram} target="_blank">
//                     <Button size="sm" variant="secondary">
//                       📸 Instagram
//                     </Button>
//                   </a>
//                 )}

//               </div>
//             )}

//             {/* ACTIONS (generic buttons) */}
//             {
            
//             !message.ui?.requestLocation && (
//             <>
//             {
//               message.ui?.actions?.map((a, i) => (
              
//                 <Button asChild key={i} size="sm" variant="outline" className="mr-2 mt-2">
//                   <Link  href={a?.type === "location-navigation"? a.a || "" : a.url || ""} target="_blank">
//                   {a.label}
//                   </Link>
//                 </Button>
              
//             ))
//             }
//             </>)
            
//             }

//             {/* MARKDOWN fallback */}
//             {message.ui?.markdown && (
//               <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
//                 {message.ui.markdown} 
//               </pre>
//             )}

//             {/* TEXT fallback */}
            
//           </div>
          
//         )}
//       </Card>
//     </div>
//   );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MapPinArea, 
  PaperPlaneRight, 
  Globe, 
  FacebookLogo, 
  InstagramLogo,
  Phone,
  WhatsappLogo,
  Compass,
  InstagramLogoIcon,
  CompassIcon,
  FacebookLogoIcon
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import AiThinkingLoader from "@/components/ai-loading";
import { Globe2 } from "lucide-react";

/* ---------------- TYPES ---------------- */

type AIUI = {
  type?: "place" | "activity" | "list" | "info";
  requestLocation: boolean;
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
      | "location-navigation";
    label: string;
    url?: string;
    a?: string;
  }[];
  options?: {
    name: string;
    description: string;
    contact: {
      phone: string;
      whatsapp: string;
    };
  }[];
  markdown?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  ui?: AIUI | null;
};

/* ---------------- MAIN PAGE ---------------- */

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function sendMessage(text?: string) {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMessage = messageText;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast.error("Network connection issue.");
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
    <div className="h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      {/* HEADER */}
      <header className="border-b bg-background/90 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400">
              Guraidhoo AI Guied
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your local companion for places, dining, and transit
            </p>
          </div>
          <Badge variant="secondary" className="font-semibold px-2.5 py-0.5 rounded-full text-xs">
            ✨ Premium Beta
          </Badge>
        </div>
      </header>

      {/* QUICK SUGGESTIONS DISMISSABLE HUB */}
      <div className="border-b bg-background/50 px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto no-scrollbar mask-inline-end">
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 shadow-sm" onClick={() => sendMessage("Cheap guesthouses")}>
            🏨 Cheap rooms
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 shadow-sm" onClick={() => sendMessage("Bike rentals")}>
            🚲 Rentals
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 shadow-sm" onClick={() => sendMessage("Things to do in Guraidhoo")}>
            🤿 Activities
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 shadow-sm" onClick={() => sendMessage("Top restaurants")}>
            🍽️ Food & Cafes
          </Button>
        </div>
      </div>

      {/* CHAT AREA */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length < 1 ? (
            <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto py-12">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                🏝️
              </div>
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
              {messages.map((msg, i) => (
                <ChatBubble 
                  key={i} 
                  message={msg} 
                  onLocationClick={(e) => sendMessage(e)} 
                />
              ))}
            </div>
          )}

          {/* LOADING INDICATOR */}
          {loading && (
            <div className="flex justify-start pl-2 animate-in fade-in-50 duration-300">
              <AiThinkingLoader />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT ANCHOR */}
      <div className="border-t p-4 bg-background/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <Input
            value={input}
            placeholder="Ask about dynamic transit routes, beach spots, cafes..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            disabled={loading}
            className="h-11 rounded-xl bg-muted/40 focus-visible:bg-background border-muted-foreground/20 transition-all shadow-sm"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={loading || !input.trim()} 
            className="h-11 px-5 rounded-xl font-medium shadow-md shadow-blue-500/10 transition-transform active:scale-95"
          >
            {loading ? "..." : <PaperPlaneRight weight="bold" className="h-4 w-4" />}
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
  onLocationClick: (text: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`p-4 rounded-2xl shadow-sm text-sm border transition-all ${
          isUser
            ? "bg-primary text-primary-foreground border-transparent rounded-tr-none max-w-[80%]"
            : "bg-background text-foreground border-border/60 rounded-tl-none max-w-[85%] md:max-w-[75%] space-y-4"
        }`}
      >
        {/* USER TEXT */}
        {isUser && <div className="leading-relaxed font-medium">{message.content}</div>}

        {/* ASSISTANT FLOWED CARD LAYOUT */}
        {!isUser && (
          <div className="space-y-3.5">
            {/* NEW CODE */}
{message.content && (
  <div className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
    {message.content}
  </div>
)}

{/* If both a message and a structural UI layout exist, add spacing between them */}
{message.content && message.ui && <div className="h-2" />}

            {/* STRUCTURAL UI BLOCK */}
            {message.ui && (
              <div className="space-y-3 bg-muted/40 p-3.5 rounded-xl border border-muted/70">
                {/* TITLE & DESCRIPTION */}
                {message.ui.title && (
                  <h2 className="font-bold text-base text-foreground tracking-tight">
                    {message.ui.title}
                  </h2>
                )}
                {message.ui.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {message.ui.description}
                  </p>
                )}

                {/* DYNAMIC LISTING OPTIONS */}
                {message.ui.options && message.ui.options.length > 0 && (
                  <div className="space-y-3 mt-2">
                    {message.ui.options.map((option, i) => (
                      <div key={i} className="bg-background border border-border/50 rounded-xl p-3 space-y-2 shadow-xs">
                        <p className="font-semibold text-sm text-foreground">{option?.name}</p>
                        <p className="text-xs text-muted-foreground leading-normal">
                          {option?.description}
                        </p>
                        
                        {/* PHONE / WHATSAPP HOOKS */}
                        <div className="flex flex-wrap gap-3 text-xs pt-1">
                          {option?.contact?.phone && (
                            <Link 
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium" 
                              href={`tel:${option?.contact?.phone}`}
                            >
                              <Phone size={14} /> Call Agent
                            </Link>
                          )}
                          {option?.contact?.whatsapp && (
                            <Link 
                              className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium" 
                              href={`https://wa.me/${option?.contact?.whatsapp.replace(/[+\s]/g, "")}`}
                              target="_blank"
                            >
                              <WhatsappLogo size={14} weight="fill" /> WhatsApp
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CATEGORIES */}
                {message.ui.categories && message.ui.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {message.ui.categories.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] uppercase font-semibold tracking-wider bg-background px-2 py-0">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* IMPERATIVE LOCATION CONTROLLER */}
                {message.ui.requestLocation && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      onClick={async () => {
                        try {
                          const permission = await navigator.permissions.query({ name: "geolocation" });
                          if (permission.state === "denied") {
                            toast.error("Location access blocked. Reset permissions in URL path.");
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              onLocationClick(`My location is ${pos.coords.latitude},${pos.coords.longitude}`);
                            },
                            () => toast.error("Unable to securely pinpoint device location."),
                            { enableHighAccuracy: true }
                          );
                        } catch {
                          toast.error("Geolocation framework exception.");
                        }
                      }}
                    >
                      Share My Location <MapPinArea weight="bold" className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* SOCIAL CHANNELS AND EXTERNAL LINK METRICS */}
                {message.ui.links && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {message.ui.links.website && (
                      <Button asChild size="xs" variant="secondary" className="text-xs h-8 rounded-lg">
                        <a href={message.ui.links.website} target="_blank" rel="noreferrer">
                          <Globe2 size={14} className="mr-1" /> Site
                        </a>
                      </Button>
                    )}
                    {message.ui.links.facebook && (
                      <Button asChild size="xs" variant="secondary" className="text-xs h-8 rounded-lg">
                        <a href={message.ui.links.facebook} target="_blank" rel="noreferrer">
                          <FacebookLogoIcon size={14} className="mr-1 text-blue-600" /> Facebook
                        </a>
                      </Button>
                    )}
                    {message.ui.links.instagram && (
                      <Button asChild size="xs" variant="secondary" className="text-xs h-8 rounded-lg">
                        <a href={message.ui.links.instagram} target="_blank" rel="noreferrer">
                          <InstagramLogoIcon size={14} className="mr-1 text-pink-600" /> Instagram
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* ACTION ROUTERS */}
                {!message.ui.requestLocation && message.ui.actions && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-muted/60 mt-2">
                    {message.ui.actions.map((a, i) => (
                      <Button asChild key={i} size="sm" variant={a.type === "location-navigation" ? "default" : "outline"} className="rounded-lg text-xs font-medium grow md:grow-0">
                        <Link href={a.url || ""} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                          {a.type === "location-navigation" && <CompassIcon size={14} weight="bold" />}
                          {a.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CLEAN MARKDOWN INLINE WRAPPING FALLBACK */}
            {message.ui?.markdown && (
              <div className="text-xs leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-xl border border-dashed whitespace-pre-wrap">
                {message.ui.markdown}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}