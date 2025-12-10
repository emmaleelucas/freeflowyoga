import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ClassesTabs } from "./classes-tabs";
import { DeleteAccountButton } from "./delete-account-button";
import { Banana, Calendar, CheckCircle2 } from "lucide-react";
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



  // Calculate stats
  const upcomingCount = upcomingClasses.length;
  const attendedCount = pastClasses.filter(c => c.attended).length;
  const memberSince = new Date(userData.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Get time of day greeting
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Banner with Gradient */}
      <div className="relative bg-gradient-to-r from-[#644874] to-[#6B92B5] text-white pt-12 pb-24 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-3xl font-bold shadow-xl">
            {userData.first_name[0]}{userData.last_name[0]}
          </div>
          <div className="text-center md:text-left mb-2 flex-1">
            <p className="text-white/80 font-medium mb-1">{greeting},</p>
            <h1 className="text-4xl font-bold">{userData.first_name} {userData.last_name}</h1>
            <p className="text-white/80 text-sm mt-1">{userData.kstate_email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-none shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#644874]/10 dark:bg-[#644874]/20 text-[#644874] dark:text-[#9d7fb0]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Upcoming Classes</p>
                <p className="text-2xl font-bold">{upcomingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#6B92B5]/10 dark:bg-[#6B92B5]/20 text-[#6B92B5] dark:text-[#8fb3d1]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Classes Attended</p>
                <p className="text-2xl font-bold">{attendedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500">
                <Banana className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Member Since</p>
                <p className="text-lg font-bold">{memberSince}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Schedule */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Schedule</h2>
              <Link href="/schedule">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  Browse Full Schedule
                </Button>
              </Link>
            </div>
            <ClassesTabs upcomingClasses={upcomingClasses} pastClasses={pastClasses} />
          </div>

          {/* Right Sidebar - Actions */}
          <div className="lg:w-80 space-y-4">
            {/* Contact Support Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:recservices@k-state.edu">
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Account Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <DeleteAccountButton />
              </CardContent>
            </Card>
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
