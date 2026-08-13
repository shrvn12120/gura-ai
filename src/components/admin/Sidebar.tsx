"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, BookOpen, MessageCircleMoreIcon } from "lucide-react";
import { ThemeChanger } from "../theme-toggle";

export default function SidebarMenu() {
  const pathname = usePathname();

  const routes = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      // Matches exactly /admin, but prevents it from lighting up for sub-routes
      active: pathname === "/admin", 
    },
    {
      label: "Listings",
      href: "/admin/listings",
      icon: Building2,
      // Active if it is on the listings page or any deeper sub-route (e.g., /new)
      active: pathname.startsWith("/admin/listings"),
    },
    {
      label: "Notices",
      href: "/admin/notice",
      icon: BookOpen,
      active: pathname.startsWith("/admin/notice"),
    },
     {
      label: "Meta configs",
      href: "/admin/config/meta-configs",
      icon: BookOpen,
      active: pathname.startsWith("/admin/config/meta-configs"),
    },
    {
      label: "Conversations",
      href: "/admin/conversations",
      icon: MessageCircleMoreIcon,
      active: pathname.startsWith("/admin/conversations"),
    },
    // conversations
  ];

  return (
    <aside className="w-64 h-screen border-r bg-card text-card-foreground p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Header styling matching Shadcn specs */}
        <div className="px-3 py-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h2>
          {/* <p className="text-xs text-muted-foreground mt-0.5">
            Maldives Booking Management
          </p> */}
         
        </div>

        {/* Navigation Elements */}
        <nav className="flex flex-col gap-1">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                  route.active
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    route.active 
                      ? "text-primary" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Optional: Bottom Footer Section */}
      <div className="">
       <p className="  py-2 text-xs text-muted-foreground border-t border-border pt-4"> Logged in as Administrator</p>
         <ThemeChanger />
      </div>
    </aside>
  );
}