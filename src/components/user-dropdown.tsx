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
import { UserCircle, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UserDropdownProps {
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export function UserDropdown({ firstName, lastName, email, isAdmin }: UserDropdownProps) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const displayName = `${firstName} ${lastName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:text-[#644874] dark:hover:text-[#9d7fb0] transition-all">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#644874] to-[#6B92B5] flex items-center justify-center text-white text-xs font-bold">
            {firstName[0]}{lastName[0]}
          </div>
          <span className="font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-[#644874]/20 dark:border-[#644874]/30">
        <DropdownMenuLabel className="text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#644874]/20 dark:bg-[#644874]/30" />
        <DropdownMenuItem asChild>
          <Link href="/protected/profile" className="cursor-pointer flex items-center gap-2 focus:bg-[#644874]/10 dark:focus:bg-[#644874]/20 focus:text-[#644874] dark:focus:text-[#9d7fb0]">
            <UserCircle className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
            Profile
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer flex items-center gap-2 focus:bg-[#644874]/10 dark:focus:bg-[#644874]/20 focus:text-[#644874] dark:focus:text-[#9d7fb0]">
              <Shield className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-[#644874]/20 dark:bg-[#644874]/30" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2 focus:bg-rose-50 dark:focus:bg-rose-900/20 focus:text-rose-700 dark:focus:text-rose-300">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
