import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin | Explore guraidhoo chat",
  description: "Manage content here.",
};

// --- Beautiful Loading Skeleton ---
function LayoutSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Fake Sidebar Skeleton */}
      <div className="w-65 h-full border-r bg-muted/20 p-4 space-y-6 hidden md:block animate-pulse">
        {/* Logo / Header area */}
        <div className="h-8 bg-muted rounded-md w-3/4 mb-8" />
        
        {/* Navigation group */}
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded-md w-1/3" /> {/* Section Title */}
          <div className="h-9 bg-muted/60 rounded-md w-full" />
          <div className="h-9 bg-muted/60 rounded-md w-full" />
          <div className="h-9 bg-muted/60 rounded-md w-full" />
        </div>

        {/* Secondary Navigation group */}
        <div className="space-y-4 pt-4">
          <div className="h-4 bg-muted rounded-md w-1/2" />
          <div className="h-9 bg-muted/60 rounded-md w-full" />
          <div className="h-9 bg-muted/60 rounded-md w-full" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Trigger bar */}
        <div className="h-14 border-b flex items-center px-6 gap-4 animate-pulse">
          <div className="h-8 w-8 bg-muted rounded-md" /> {/* Fake Sidebar Trigger */}
          <div className="h-4 bg-muted rounded-md w-32" /> {/* Breadcrumb / Title */}
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-auto max-w-4xl w-full mx-auto animate-pulse">
          {/* Header text skeletons */}
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-md w-1/3" />
            <div className="h-4 bg-muted/60 rounded-md w-1/2" />
          </div>

          {/* Dummy dashboard cards/layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-muted/40 rounded-xl border border-muted/50" />
            <div className="h-28 bg-muted/40 rounded-xl border border-muted/50" />
            <div className="h-28 bg-muted/40 rounded-xl border border-muted/50" />
          </div>

          {/* Large body skeleton */}
          <div className="h-64 bg-muted/30 rounded-xl border border-muted/50 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <div className="w-full space-y-6 flex flex-col items-center mx-auto p-6 overflow-auto">
          {children}
        </div>
      </SidebarProvider>
    </Suspense>
  )
}