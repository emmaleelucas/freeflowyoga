import Calendar from "@/components/schedule/Calendar";
import { getAllYogaClasses, getAllYogaClassesIncludingPast } from "@/lib/actions";
import { Suspense } from "react";

interface ScheduleContentProps {
  searchParams: Promise<{ classId?: string }>;
}

async function ScheduleContent({ searchParams }: ScheduleContentProps) {
  const [upcomingClasses, allClasses, params] = await Promise.all([
    getAllYogaClasses(),
    getAllYogaClassesIncludingPast(),
    searchParams
  ]);

  const initialClassId = params.classId ? parseInt(params.classId, 10) : undefined;

  return <Calendar upcomingClasses={upcomingClasses} allClasses={allClasses} initialClassId={initialClassId} />;
}

interface SchedulePageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default function SchedulePage({ searchParams }: SchedulePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#644874]/5 to-background dark:from-[#644874]/10 dark:to-background">
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Class Schedule</h1>

        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        }>
          <ScheduleContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
