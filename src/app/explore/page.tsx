import { getAllSeries, getAllClassLocations } from "@/lib/actions";
import { Suspense } from "react";
import { ExploreContent } from "./explore-content";

async function ExploreData() {
  const [series, locations] = await Promise.all([
    getAllSeries(),
    getAllClassLocations()
  ]);

  return <ExploreContent series={series} classLocations={locations} />;
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#644874]/5 to-background dark:from-[#644874]/10 dark:to-background">
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        }>
          <ExploreData />
        </Suspense>
      </div>
    </div>
  );
}
