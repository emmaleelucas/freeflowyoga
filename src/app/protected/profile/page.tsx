import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ClassesTabs } from "./classes-tabs";
import { DeleteAccountButton } from "./delete-account-button";
import { Banana } from "lucide-react";
import { getUserUpcomingClasses, getUserPastClasses } from "@/lib/actions";

async function ProfileContent() {
  const supabase = await createClient();

  // Get auth user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  // Get user profile from users table
  const { data: userData } = await supabase
    .from('users')
    .select('first_name, last_name, kstate_email, created_at')
    .eq('id', userId)
    .single();

  if (!userData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>
            Your profile hasn't been created yet. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get user's registered classes
  const upcomingClasses = await getUserUpcomingClasses();
  const pastClasses = await getUserPastClasses();



  return (
    <div className="w-full h-[calc(100vh-1rem)] overflow-hidden flex justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8 w-full max-w-7xl h-full px-5 pt-8">
        {/* Left Sidebar - User Info */}
        <div className="space-y-6 h-fit">
          <Card className="bg-gradient-to-br from-[#644874]/10 via-[#644874]/5 to-[#6B92B5]/10 dark:from-[#644874]/30 dark:via-[#644874]/20 dark:to-[#6B92B5]/20 border-2 border-[#644874]/20 dark:border-[#644874]/40 sticky top-8">
            <CardHeader className="pb-0 space-y-3">
              <div className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-0">
                <div className="w-8 h-8 lg:w-24 lg:h-24 rounded-full bg-gradient-to-r from-[#644874] to-[#6B92B5] lg:mx-auto lg:mb-4 flex items-center justify-center text-white text-sm lg:text-3xl font-bold flex-shrink-0">
                  {userData.first_name[0]}{userData.last_name[0]}
                </div>
                <div className="flex-1 lg:flex-none space-y-1 lg:space-y-0">
                  <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent lg:text-center lg:mb-2">
                    {userData.first_name} {userData.last_name}
                  </h1>
                  <p className="text-sm text-muted-foreground lg:text-center lg:mb-4">{userData.kstate_email}</p>
                </div>
              </div>
              <div className="flex lg:justify-center">
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                  <Banana className="h-3 w-3 text-yellow-500" />
                  <span className="whitespace-nowrap">
                    Yoga-ing since {new Date(userData.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-3 border-t border-[#644874]/20 dark:border-[#644874]/30 pt-6 mx-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Upcoming Classes</span>
                  <span className="font-semibold text-[#644874] dark:text-[#9d7fb0]">{upcomingClasses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Classes Attended</span>
                  <span className="font-semibold text-[#644874] dark:text-[#9d7fb0]">
                    {pastClasses.filter(c => c.attended).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DeleteAccountButton />
        </div>

        {/* Right Content - Classes */}
        <div className="w-full min-w-0 max-w-full h-full flex flex-col min-h-0">
          <h2 className="text-3xl font-bold mb-3 flex-shrink-0">My Classes</h2>
          <div className="flex-1 min-h-0">
            <ClassesTabs upcomingClasses={upcomingClasses} pastClasses={pastClasses} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
