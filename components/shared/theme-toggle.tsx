"use client"

import * as React from "react"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl">
        <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" />
          <span className="flex-1">Light</span>
          {theme === "light" ? <Check className="size-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" />
          <span className="flex-1">Dark</span>
          {theme === "dark" ? <Check className="size-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("system")}>
          <Monitor className="mr-2 size-4" />
          <span className="flex-1">System</span>
          {theme === "system" ? <Check className="size-4" /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
