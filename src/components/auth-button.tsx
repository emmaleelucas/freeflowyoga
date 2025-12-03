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
        <Button asChild size="sm" variant={"outline"} className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Get user profile from users table
  const { data: userData } = await supabase
    .from('users')
    .select('first_name, last_name, kstate_email')
    .eq('id', userId)
    .single();

  if (!userData) {
    // Fallback if user profile doesn't exist yet
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/profile">Complete Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <UserDropdown
      firstName={userData.first_name}
      lastName={userData.last_name}
      email={userData.kstate_email}
    />
  );
}
