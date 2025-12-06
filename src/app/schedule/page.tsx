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
    <div className="min-h-screen bg-[#644874]/5 dark:bg-[#644874]/10">
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
            Class Schedule
          </h1>
        </div>
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
