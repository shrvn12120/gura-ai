"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { useState } from "react";

export function ThemeChanger() {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme || "system")

  return (
    <div className="inline-flex gap-2 items-center rounded-xl border bg-background  shadow-sm">
      <Button
      size="xs"
        onClick={() => {
          setTheme("light")
          setCurrentTheme("light")
        }}
       variant={`${currentTheme !== "dark" ? "default" : "outline"}`}
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>

      <Button
      size="xs"
      variant={`${currentTheme === "dark" ? "default" : "outline"}`}
        onClick={() => {
          setTheme("dark")
           setCurrentTheme("dark")
        }}
        className={` ${currentTheme === "dark" ? "bg-primary text-primary-foreground scale-95" : ""}`}
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
    </div>
  );
}