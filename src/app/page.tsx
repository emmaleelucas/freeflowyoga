import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Heart, Clock, MapPin, User, ChevronRight, Map } from "lucide-react";
import { getAllYogaClasses } from "@/lib/actions";
import { HomeHero } from "@/components/home/home-hero";
import { Suspense } from "react";

// Loading skeleton for upcoming classes
function UpcomingClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-2 animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 bg-muted rounded w-2/3 mb-3"></div>
            <div className="h-6 bg-muted rounded w-full mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Async component for upcoming classes
async function UpcomingClassesPreview() {
  const upcomingClasses = await getAllYogaClasses();
  const previewClasses = upcomingClasses.slice(0, 3);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long'
    });
  };

  if (previewClasses.length === 0) {
    return (
      <Card className="border-2 border-dashed border-[#644874]/20 dark:border-[#644874]/30">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-[#644874]/40 dark:text-[#644874]/50 mb-4" />
          <p className="text-muted-foreground">No upcoming classes scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {previewClasses.map((yogaClass, index) => (
        <Link key={yogaClass.id} href={`/schedule?classId=${yogaClass.id}`}>
          <Card
            className={`border-2 hover:border-[#644874]/40 dark:hover:border-[#644874]/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full bg-white/80 dark:bg-background/80 backdrop-blur-sm animate-fade-in opacity-0`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-[#644874] dark:text-[#9d7fb0] mb-3">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(yogaClass.startTime)}</span>
                <span className="text-muted-foreground">•</span>
                <Clock className="h-4 w-4" />
                <span>{formatTime(yogaClass.startTime)}</span>
              </div>

              <h3 className="font-semibold text-lg mb-2">{yogaClass.className}</h3>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#6B92B5]" />
                  <span>{yogaClass.instructorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#6B92B5]" />
                  <span className="truncate">{yogaClass.buildingName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#644874]/60 dark:bg-[#644874]/40 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#6B92B5]/60 dark:bg-[#6B92B5]/40 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#7a5a8a]/50 dark:bg-[#7a5a8a]/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <HomeHero />

      {/* Benefits Section */}
      <section className="pt-4 pb-8 md:pt-8 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-[#6B92B5]/40 dark:hover:border-[#6B92B5]/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-on-scroll opacity-0 translate-y-8">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B92B5]/10 to-[#6B92B5]/20 dark:from-[#6B92B5]/30 dark:to-[#6B92B5]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-[#6B92B5] dark:text-[#8fb3d1]" />
                  </div>
                  <h3 className="text-xl font-semibold">All Levels Welcome</h3>
                </div>
                <p className="text-muted-foreground">
                  No experience needed — just bring yourself and an open mind.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#644874]/40 dark:hover:border-[#644874]/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-on-scroll opacity-0 translate-y-8 delay-100">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#644874]/10 to-[#6B92B5]/20 dark:from-[#644874]/30 dark:to-[#6B92B5]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-6 w-6 text-[#644874] dark:text-[#9d7fb0]" />
                  </div>
                  <h3 className="text-xl font-semibold">Mind & Body</h3>
                </div>
                <p className="text-muted-foreground">
                  Find balance, build strength, improve flexibility, reduce stress.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* View Class Schedule Button */}
          <div className="flex justify-center mt-10 animate-on-scroll opacity-0 translate-y-8 delay-200">
            <Button asChild size="lg" className="bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Link href="/schedule">View Class Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Classes Preview */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
                  Upcoming Classes
                </h2>
              </div>
              <Link href="/explore">
                <Button variant="outline" className="border-[#644874]/30 hover:bg-[#644874]/10 hover:border-[#644874]/50 dark:border-[#644874]/40 dark:hover:bg-[#644874]/20">
                  <Map className="h-4 w-4 mr-2" />
                  Explore
                </Button>
              </Link>
            </div>

            <div>
              <Suspense fallback={<UpcomingClassesSkeleton />}>
                <UpcomingClassesPreview />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
