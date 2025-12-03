import Calendar from "@/components/schedule/Calendar";
import { getAllYogaClasses, getAllYogaClassesIncludingPast } from "@/lib/actions";
import { Suspense } from "react";

async function ScheduleContent() {
  const upcomingClasses = await getAllYogaClasses();
  const allClasses = await getAllYogaClassesIncludingPast();

  return <Calendar upcomingClasses={upcomingClasses} allClasses={allClasses} />;
}

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-purple-100/30 dark:bg-purple-950/10">
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Class Schedule
          </h1>
          <p className="text-purple-700 dark:text-purple-300">Browse and sign up for upcoming yoga classes</p>
        </div>
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        }>
          <ScheduleContent />
        </Suspense>
      </div>
    </div>
  );
}
