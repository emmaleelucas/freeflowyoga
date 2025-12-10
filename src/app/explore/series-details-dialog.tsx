"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, CheckCircle2, X } from "lucide-react";
import { SeriesWithDetails, registerForClass, unregisterFromClass } from "@/lib/actions";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

type ClassInstance = {
  id: number;
  className: string;
  startTime: Date;
  endTime: Date;
  instructorName: string;
  matsProvided: boolean;
  isCancelled: boolean;
  roomName: string;
  buildingName: string;
  buildingAddress: string;
  isRegistered: boolean;
};

interface SeriesDetailsDialogProps {
  series: SeriesWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeriesDetailsDialog({ series, open, onOpenChange }: SeriesDetailsDialogProps) {
  const [classes, setClasses] = useState<ClassInstance[]>([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeringClassId, setRegisteringClassId] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open, series.id]);

  async function fetchClasses() {
    setLoading(true);
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    // Fetch upcoming class instances for this series
    const { data, error } = await supabase
      .from('yoga_classes')
      .select(`
        id,
        class_name,
        start_time,
        end_time,
        instructor_name,
        mats_provided,
        is_cancelled,
        room_number,
        buildings (
          building_name,
          building_address
        )
      `)
      .eq('series_id', series.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching classes:', error);
      setLoading(false);
      return;
    }

    // Check registration status for each class if user is logged in
    let registrationMap: { [key: number]: boolean } = {};
    if (user && data) {
      const classIds = data.map((c: any) => c.id);
      const { data: registrations } = await supabase
        .from('class_attendance')
        .select('class_id')
        .eq('user_id', user.id)
        .in('class_id', classIds);

      if (registrations) {
        registrationMap = registrations.reduce((acc: any, reg: any) => {
          acc[reg.class_id] = true;
          return acc;
        }, {});
      }
    }

    const normalizedClasses = data?.map((c: any) => ({
      id: c.id,
      className: c.class_name,
      startTime: new Date(c.start_time),
      endTime: new Date(c.end_time),
      instructorName: c.instructor_name,
      matsProvided: c.mats_provided,
      isCancelled: c.is_cancelled,
      roomName: c.room_number || 'TBA',
      buildingName: c.buildings?.building_name || 'TBA',
      buildingAddress: c.buildings?.building_address || 'TBA',
      isRegistered: registrationMap[c.id] || false
    })) || [];

    setClasses(normalizedClasses);
    setLoading(false);
    setVisibleCount(2);
  }

  const formatTime = (time: string | Date) => {
    let hours: number, minutes: number;

    if (typeof time === 'string') {
      [hours, minutes] = time.split(':').map(Number);
    } else {
      hours = time.getHours();
      minutes = time.getMinutes();
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const visibleClasses = classes.slice(0, visibleCount);
  const hasMore = visibleCount < classes.length;

  const handleViewMore = () => {
    setVisibleCount(prev => prev + 2);
    // Scroll to bottom after state update
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTo({
          top: contentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleRegister = async (classId: number) => {
    setRegisteringClassId(classId);
    const result = await registerForClass(classId);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Successfully signed up for class!");
      // Update the local state
      setClasses(prev => prev.map(c =>
        c.id === classId ? { ...c, isRegistered: true } : c
      ));
    }

    setRegisteringClassId(null);
  };

  const handleUnregister = async (classId: number) => {
    setRegisteringClassId(classId);
    const result = await unregisterFromClass(classId);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Successfully removed from class");
      // Update the local state
      setClasses(prev => prev.map(c =>
        c.id === classId ? { ...c, isRegistered: false } : c
      ));
    }

    setRegisteringClassId(null);
  };

  const hasClassStarted = (startTime: Date) => {
    return new Date() >= startTime;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 p-6 pb-4 border-b bg-background">
          <DialogHeader>
            <DialogTitle className="text-2xl pr-10">{series.seriesName}</DialogTitle>
            <div className="flex items-center justify-between gap-4 mt-3">
              <p className="text-sm text-muted-foreground">
                {formatTime(series.startTime)} - {formatTime(series.endTime)}
              </p>
              <Badge
                variant={series.matsProvided ? "secondary" : "outline"}
                className={series.matsProvided
                  ? "bg-[#644874]/10 text-[#644874] dark:bg-[#644874]/20 dark:text-[#9d7fb0] hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20"
                  : "border-[#644874] text-[#644874] hover:bg-transparent"
                }
              >
                {series.matsProvided ? "Mats Provided" : "BYO Mat"}
              </Badge>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-4">
            {series.seriesDescription}
          </p>
        </div>

        {/* Scrollable Classes Section */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 pt-4">
          <h3 className="font-semibold mb-3 text-sm">Upcoming Classes</h3>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming classes scheduled
            </div>
          ) : (
            <div className="space-y-2">
              {visibleClasses.map((classInstance) => {
                const isStarted = hasClassStarted(classInstance.startTime);
                const isProcessing = registeringClassId === classInstance.id;

                return (
                  <div
                    key={classInstance.id}
                    className={`border rounded-lg p-2.5 transition-shadow duration-200 ${classInstance.isCancelled
                      ? 'opacity-50 bg-gray-100 dark:bg-gray-900'
                      : 'bg-gray-50/70 dark:bg-[#644874]/5 border-gray-200 dark:border-[#644874]/20 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#644874]" />
                        <span className="font-medium text-sm">{formatDate(classInstance.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {classInstance.isCancelled && (
                          <Badge variant="destructive" className="text-xs hover:bg-destructive">Cancelled</Badge>
                        )}
                        {!classInstance.isCancelled && classInstance.isRegistered && (
                          <Badge className="bg-[#6B92B5]/15 text-[#6B92B5] dark:bg-[#6B92B5]/20 dark:text-[#9dbdd6] text-xs hover:bg-[#6B92B5]/15 dark:hover:bg-[#6B92B5]/20">
                            Signed Up
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#644874]" />
                        <span>
                          {formatTime(classInstance.startTime)} - {formatTime(classInstance.endTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#644874]" />
                        <span>{classInstance.instructorName}</span>
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="h-4 w-4 text-[#644874]" />
                        <span>{classInstance.buildingName} - {classInstance.roomName}</span>
                      </div>
                    </div>

                    {/* Sign up button */}
                    {!classInstance.isCancelled && (
                      <div className="mt-1.5">
                        {!isAuthenticated ? (
                          <Link href="/auth/login">
                            <Button variant="outline" className="w-full h-8 text-xs">
                              Sign in to Sign Up
                            </Button>
                          </Link>
                        ) : isStarted ? (
                          <Button variant="outline" disabled className="w-full h-8 text-xs">
                            Class Started
                          </Button>
                        ) : classInstance.isRegistered ? (
                          <Button
                            variant="outline"
                            onClick={() => handleUnregister(classInstance.id)}
                            disabled={isProcessing}
                            className="w-full h-8 text-xs border-rose-200/60 text-rose-500 hover:bg-rose-50/50 dark:border-rose-800/30 dark:text-rose-400 dark:hover:bg-rose-900/10"
                          >
                            {isProcessing ? (
                              "Processing..."
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleRegister(classInstance.id)}
                            disabled={isProcessing}
                            className="w-full h-8 text-xs bg-[#644874] hover:bg-[#553965]"
                          >
                            {isProcessing ? (
                              "Processing..."
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Sign Up
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full mt-1.5 h-8 text-xs"
                  onClick={handleViewMore}
                >
                  View More
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
