"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UserDropdownProps {
  firstName: string;
  lastName: string;
  email: string;
}

export function UserDropdown({ firstName, lastName, email }: UserDropdownProps) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const displayName = `${firstName} ${lastName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
            {firstName[0]}{lastName[0]}
          </div>
          <span className="font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-purple-200 dark:border-purple-800">
        <DropdownMenuLabel className="text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-200 dark:bg-purple-800" />
        <DropdownMenuItem asChild>
          <Link href="/protected/profile" className="cursor-pointer flex items-center gap-2 focus:bg-purple-100 dark:focus:bg-purple-900/30 focus:text-purple-700 dark:focus:text-purple-300">
            <UserCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-purple-200 dark:bg-purple-800" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2 focus:bg-red-100 dark:focus:bg-red-900/30 focus:text-red-700 dark:focus:text-red-300">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
