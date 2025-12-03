"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, AlignLeft, User, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { unregisterFromClass } from "@/lib/actions";
import { toast } from "sonner";

interface YogaClass {
  id: number;
  class_name: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  class_description: string;
  mats_provided: boolean;
  is_cancelled: boolean;
  rooms?: {
    room_name: string;
    buildings?: {
      building_name: string;
      building_address: string;
    };
  };
}

interface Registration {
  id: number;
  registered_at: string;
  attended: boolean;
  yoga_classes: YogaClass;
}

interface ClassesTabsProps {
  upcomingClasses: Registration[];
  pastClasses: Registration[];
}

export function ClassesTabs({ upcomingClasses, pastClasses }: ClassesTabsProps) {
  const [upcomingDisplayCount, setUpcomingDisplayCount] = useState(2);
  const [pastDisplayCount, setPastDisplayCount] = useState(2);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [classToCancel, setClassToCancel] = useState<{ id: number; classId: number; name: string } | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [removedRegistrationIds, setRemovedRegistrationIds] = useState<Set<number>>(new Set());
  const [removingRegistrationIds, setRemovingRegistrationIds] = useState<Set<number>>(new Set());

  const INITIAL_DISPLAY_COUNT = 2;
  const INCREMENT_COUNT = 4;

  // Filter out removed registrations
  const filteredUpcomingClasses = upcomingClasses.filter(c => !removedRegistrationIds.has(c.id));
  const filteredPastClasses = pastClasses.filter(c => !removedRegistrationIds.has(c.id));

  const displayedUpcomingClasses = filteredUpcomingClasses.slice(0, upcomingDisplayCount);
  const displayedPastClasses = filteredPastClasses.slice(0, pastDisplayCount);

  const handleViewMoreUpcoming = () => {
    setUpcomingDisplayCount(prev => Math.min(prev + INCREMENT_COUNT, filteredUpcomingClasses.length));
  };

  const handleViewLessUpcoming = () => {
    setUpcomingDisplayCount(INITIAL_DISPLAY_COUNT);
  };

  const handleViewMorePast = () => {
    setPastDisplayCount(prev => Math.min(prev + INCREMENT_COUNT, filteredPastClasses.length));
  };

  const handleViewLessPast = () => {
    setPastDisplayCount(INITIAL_DISPLAY_COUNT);
  };

  const handleCancelClick = (registrationId: number, classId: number, className: string) => {
    setClassToCancel({ id: registrationId, classId, name: className });
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!classToCancel) return;

    setIsCanceling(true);

    // Add to removing set for fade-out animation (using registration ID)
    setRemovingRegistrationIds(prev => new Set(prev).add(classToCancel.id));

    const result = await unregisterFromClass(classToCancel.classId);
    setIsCanceling(false);
    setCancelDialogOpen(false);

    if (result.success) {
      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setRemovedRegistrationIds(prev => new Set(prev).add(classToCancel.id));
        setRemovingRegistrationIds(prev => {
          const next = new Set(prev);
          next.delete(classToCancel.id);
          return next;
        });
        toast.success(`${classToCancel.name} was removed from your schedule`, {
          className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
          style: {
            color: 'rgb(30 58 138)', // blue-900
          },
        });
      }, 300); // Match animation duration

      setClassToCancel(null);
    } else if (result.error) {
      // Remove from removing set if error
      setRemovingRegistrationIds(prev => {
        const next = new Set(prev);
        next.delete(classToCancel.id);
        return next;
      });
      toast.error(result.error);
      setClassToCancel(null);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full h-full">
      <Tabs defaultValue="upcoming" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
        <TabsTrigger value="upcoming" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-purple-950 data-[state=active]:shadow-md data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 rounded-md transition-all">
          Upcoming ({filteredUpcomingClasses.length})
        </TabsTrigger>
        <TabsTrigger value="past" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-purple-950 data-[state=active]:shadow-md data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 rounded-md transition-all">
          Past ({filteredPastClasses.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-6 w-full h-[calc(100%-3rem-1.5rem)] overflow-y-auto pr-4">
        {filteredUpcomingClasses.length === 0 ? (
          <p className="text-muted-foreground">No upcoming classes. Any classes you sign up for will appear here. </p>
        ) : (
          <div className="w-full flex flex-col gap-4 pb-4">
            {displayedUpcomingClasses.map((registration) => {
              const classData = registration.yoga_classes;
              const isRemoving = removingRegistrationIds.has(registration.id);
              return (
                <Card
                  key={registration.id}
                  className={`relative overflow-hidden border-2 shadow-none transition-all duration-300 ${
                    isRemoving
                      ? 'opacity-0 scale-95 -translate-x-4'
                      : 'opacity-100 scale-100 translate-x-0'
                  } ${classData.is_cancelled ? '' : 'hover:border-purple-200 dark:hover:border-purple-900'}`}
                >
                  <CardHeader className="pb-3">
                  {classData.is_cancelled && (
                    <div className="pb-2">
                      <Badge className="w-full text-center text-xs font-bold px-4 py-1 pointer-events-none" variant="destructive">
                        This class was cancelled.
                      </Badge>
                    </div>
                  )}
                    <div className={`flex flex-col ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl font-bold flex-1">{classData.class_name}</CardTitle>
                      <div className="flex flex-nowrap gap-2 shrink-0">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 whitespace-nowrap hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300 pointer-events-none">
                          {classData.mats_provided ? "Mats Provided" : "Bring Your Own Mat"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium mt-2">
                      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>{new Date(classData.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>{new Date(classData.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })} - {new Date(classData.end_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    </div>
                  </CardHeader>
                  <CardContent className={`space-y-3 pb-3 ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span>{classData.instructor_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-5 w-5 mt-0.5 text-purple-600 dark:text-purple-400" />
                      <span>{classData.rooms?.room_name}, {classData.rooms?.buildings?.building_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <AlignLeft className="h-5 w-5 mt-0.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                      <p className="text-muted-foreground">{classData.class_description}</p>
                    </div>
                    {!classData.is_cancelled && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelClick(registration.id, classData.id, classData.class_name)}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove from Schedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredUpcomingClasses.length > INITIAL_DISPLAY_COUNT && (
              <div className="flex flex-col gap-2">
                {upcomingDisplayCount >= filteredUpcomingClasses.length && (
                  <Button
                    variant="outline"
                    onClick={handleViewLessUpcoming}
                    className="w-full gap-2"
                  >
                    <ChevronUp className="h-4 w-4" />
                    View Less
                  </Button>
                )}
                {upcomingDisplayCount < filteredUpcomingClasses.length && (
                  <Button
                    variant="outline"
                    onClick={handleViewMoreUpcoming}
                    className="w-full gap-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                    View More
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-6 w-full h-[calc(100%-3rem-1.5rem)] overflow-y-auto pr-4">
        {filteredPastClasses.length === 0 ? (
          <p className="text-muted-foreground">No past classes yet. Your class history will appear here.</p>
        ) : (
          <div className="w-full flex flex-col gap-4 pb-4">
            {displayedPastClasses.map((registration) => {
              const classData = registration.yoga_classes;
              const isRemoving = removingRegistrationIds.has(registration.id);
              return (
                <Card
                  key={registration.id}
                  className={`relative border shadow-none transition-all duration-300 bg-muted/30 ${
                    isRemoving
                      ? 'opacity-0 scale-95 -translate-x-4'
                      : 'opacity-100 scale-100 translate-x-0'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl font-bold flex-1">{classData.class_name}</CardTitle>
                      <div className="flex flex-nowrap gap-2 shrink-0">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground whitespace-nowrap hover:bg-muted hover:text-muted-foreground pointer-events-none">
                          {classData.mats_provided ? "Mats Provided" : "Bring Your Own Mat"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(classData.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(classData.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })} - {new Date(classData.end_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </CardHeader>
                  <CardContent className={`space-y-3 ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span>{classData.instructor_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <span>{classData.rooms?.room_name}, {classData.rooms?.buildings?.building_name}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPastClasses.length > INITIAL_DISPLAY_COUNT && (
              <div className="flex flex-col gap-2">
                {pastDisplayCount >= filteredPastClasses.length && (
                  <Button
                    variant="outline"
                    onClick={handleViewLessPast}
                    className="w-full gap-2"
                  >
                    <ChevronUp className="h-4 w-4" />
                    View Less
                  </Button>
                )}
                {pastDisplayCount < filteredPastClasses.length && (
                  <Button
                    variant="outline"
                    onClick={handleViewMorePast}
                    className="w-full gap-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                    View More
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </TabsContent>
      </Tabs>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{classToCancel?.name}</span> from your schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>No, Keep Class</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isCanceling ? "Removing..." : "Yes, Remove Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
