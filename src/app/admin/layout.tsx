import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Explore guraidhoo chat",
  description: "Manage content here.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />

        <SidebarTrigger />
        <div className="w-full max-w-5xl space-y-6 flex flex-col items-center mx-auto p-6 overflow-auto">
        {children}
        </div>

    </SidebarProvider>
  )
}