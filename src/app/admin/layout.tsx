// src/app/admin/layout.tsx

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Listings",
    href: "/admin/listings",
  },
  {
    label: "New Listing",
    href: "/admin/listings/new",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
        <h1 className="font-semibold text-lg">Admin Panel</h1>

        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-md border p-2">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72">
            <div className="space-y-6 pt-6">
              <h2 className="text-xl font-bold">Admin Panel</h2>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/30 md:flex md:flex-col">
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}