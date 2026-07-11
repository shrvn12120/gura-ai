"use client";

import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type NoticeType =
  | "event"
  | "announcement"
  | "warning"
  | "info";

export interface Notice {
  _id: string;
  title: string;
  message: string;
  type: NoticeType;
}

const noticeStyles = {
  event: {
    badge: "destructive" as const,
    border: "border-destructive",
  },
  announcement: {
    badge: "default" as const,
    border: "border-primary",
  },
  warning: {
    badge: "secondary" as const,
    border: "border-yellow-500",
  },
  info: {
    badge: "outline" as const,
    border: "border-blue-500",
  },
};

export interface NoticeCarouselProps {
  notices: Notice[];
}

export default function NoticeCarousel({
  notices,
}: NoticeCarouselProps) {
  const plugin = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  if (!notices.length) return null;

  const [api, setApi] = useState<CarouselApi>();
const [current, setCurrent] = useState(0);

useEffect(() => {
  if (!api) return;

  const update = () => setCurrent(api.selectedScrollSnap());

  update();
  api.on("select", update);

  return () => {
    api.off("select", update);
  };
}, [api]);

  return (
    <Carousel
    setApi={setApi}
      plugins={[plugin.current]}
      opts={{
        loop: true,
        align: "center",
      }}
      className="w-full max-w-xl mx-auto"
    >
      <CarouselContent>
        {notices.map((notice) => (
          <CarouselItem key={notice._id}>
             <Card key={notice._id}  className={`
                relative
                rounded-xl
                border
                ${noticeStyles[notice.type].border}
                bg-card
                p-6
                min-h-35
                shadow-sm
                w-full
              `}>
      <CardHeader>
        <CardTitle>{notice.title}
            <span><Badge
                variant={noticeStyles[notice.type].badge}
                className="capitalize"
              >
                {notice.type}
              </Badge></span>
        </CardTitle>
        <CardDescription>
         
{notice.message}
        </CardDescription>
        <CardAction>
          
        </CardAction>
      </CardHeader>
      <CardContent>
       
      </CardContent>

    </Card>
          </CarouselItem>
        ))}
      </CarouselContent>

      
      <div className="mt-4 flex justify-center gap-2">
  {notices.map((_, index) => (
    <button
      key={index}
      onClick={() => api?.scrollTo(index)}
      className={`h-2 w-2 rounded-full transition-all ${
        current === index
          ? "bg-primary w-6"
          : "bg-muted-foreground/30"
      }`}
    />
  ))}
</div>

      {notices.length > 1 && (
        <>
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </>
      )}
    </Carousel>
  );
}