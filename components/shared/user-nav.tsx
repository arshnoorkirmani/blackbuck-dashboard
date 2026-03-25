"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LogOut, User, Loader2 } from "lucide-react";
import Link from "next/link";

export function UserNav({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border bg-muted/40 hover:bg-muted/80">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className="font-mono text-[10px] font-bold tracking-wider">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-border shadow-md" align="end" forceMount>
        <DropdownMenuLabel className="font-normal border-b border-border/40 pb-2 mb-1">
          <div className="flex flex-col space-y-1">
            <p className="font-heading text-sm font-bold leading-none tracking-tight text-foreground">{user.name || "User"}</p>
            <p className="font-mono text-[10px] leading-none text-muted-foreground tracking-wide truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-primary/10 py-2">
              <User className="mr-2 h-4 w-4 text-primary" strokeWidth={2.5} />
              <span className="font-medium text-sm">My Profile</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2" 
          onSelect={(e) => {
            e.preventDefault();
            setShowLogoutAlert(true);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={2.5} />
          <span className="font-medium text-sm">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will securely sign you out of your operations dashboard profile on this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            disabled={isLoggingOut}
            onClick={(e) => {
              e.preventDefault();
              setIsLoggingOut(true);
              signOut({ callbackUrl: "/" });
            }}
            className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin text-destructive-foreground/70" />}
            Confirm Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
