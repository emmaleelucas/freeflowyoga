import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserDropdown } from "./user-dropdown";

export async function AuthButton() {
  const supabase = await createClient();

  // Get auth user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"} className="border-[#644874]/30 dark:border-[#644874]/40 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:text-[#644874] dark:hover:text-[#9d7fb0] transition-all">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0] text-white shadow-md hover:shadow-lg transition-all">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Get user profile from users table
  const { data: userData } = await supabase
    .from('users')
    .select('first_name, last_name, kstate_email, is_admin')
    .eq('id', userId)
    .single();

  if (!userData) {
    // If user is authenticated but has no profile, show sign in/sign up
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"} className="border-[#644874]/30 dark:border-[#644874]/40 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:text-[#644874] dark:hover:text-[#9d7fb0] transition-all">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0] text-white shadow-md hover:shadow-lg transition-all">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <UserDropdown
      firstName={userData.first_name}
      lastName={userData.last_name}
      email={userData.kstate_email}
      isAdmin={userData.is_admin ?? false}
    />
  );
}
