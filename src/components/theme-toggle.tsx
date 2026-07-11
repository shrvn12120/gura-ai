"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export function ThemeChanger() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex gap-2 items-center rounded-xl border bg-background  shadow-sm">
      <Button
      size="xs"
        onClick={() => setTheme("light")}
       variant={`${theme !== "dark" ? "default" : "outline"}`}
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>

      <Button
      size="xs"
      variant={`${theme === "dark" ? "default" : "outline"}`}
        onClick={() => setTheme("dark")}
        className={` ${theme === "dark" ? "bg-primary text-primary-foreground scale-95" : ""}`}
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
    </div>
  );
}