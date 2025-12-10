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
import { Calendar, MapPin, Clock, AlignLeft, User, ChevronDown, ChevronUp, X, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { unregisterFromClass } from "@/lib/actions";
import { toast } from "sonner";
import Link from "next/link";

interface YogaClass {
  id: number;
  class_name: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  class_description: string;
  mats_provided: boolean;
  is_cancelled: boolean;
  room_number?: string;
  buildings?: {
    building_name: string;
    building_address: string;
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
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const INITIAL_DISPLAY_COUNT = 2;
  const INCREMENT_COUNT = 6;

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

  const toggleCardExpanded = (registrationId: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(registrationId)) {
        next.delete(registrationId);
      } else {
        next.add(registrationId);
      }
      return next;
    });
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
      }, 500); // Match animation duration

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
    <div className="w-full min-w-0 max-w-full">
      <Tabs defaultValue="upcoming" className="w-full flex flex-col">
        <TabsList className="sticky top-16 z-40 grid w-full grid-cols-2 h-12 bg-gradient-to-r from-[#644874]/5 to-[#6B92B5]/5 dark:from-[#644874]/10 dark:to-[#6B92B5]/10 backdrop-blur-md p-1 rounded-xl mb-8 shadow-md border border-[#644874]/20 dark:border-[#644874]/30">
          <TabsTrigger
            value="upcoming"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#644874] data-[state=active]:to-[#6B92B5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 text-muted-foreground hover:text-foreground font-medium"
          >
            Upcoming ({filteredUpcomingClasses.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 text-muted-foreground hover:text-foreground font-medium"
          >
            Past ({filteredPastClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="w-full animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          {filteredUpcomingClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-xl border-muted">
              <div className="rounded-full bg-[#644874]/10 dark:bg-[#644874]/20 p-4 mb-4">
                <CalendarPlus className="h-8 w-8 text-[#644874] dark:text-[#9d7fb0]" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Upcoming Classes</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                You haven't signed up for any classes yet. Browse the schedule to find a class.
              </p>
              <Link href="/schedule">
                <Button className="bg-[#644874] hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965]">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Browse Schedule
                </Button>
              </Link>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {displayedUpcomingClasses.map((registration) => {
                  const classData = registration.yoga_classes;
                  const isRemoving = removingRegistrationIds.has(registration.id);
                  const googleMapsUrl = classData.buildings?.building_address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(classData.buildings.building_address)}`
                    : null;
                  return (
                    <Card
                      key={registration.id}
                      className={`relative overflow-hidden shadow-sm transition-all duration-500 ease-in-out bg-gradient-to-br from-white via-[#644874]/5 to-[#6B92B5]/10 dark:from-gray-900 dark:via-[#644874]/10 dark:to-[#6B92B5]/10 border border-[#644874]/10 dark:border-[#644874]/30 ${isRemoving
                        ? 'opacity-0 scale-95 max-h-0 mb-0 border-0 py-0'
                        : 'opacity-100 scale-100'
                        } ${classData.is_cancelled ? '' : 'hover:border-[#644874]/30 hover:shadow-md hover:-translate-y-0.5'}`}
                    >
                      <CardHeader className="pb-2 pt-4 px-6 relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#644874]/10 to-[#6B92B5]/10 dark:from-[#644874]/20 dark:to-[#6B92B5]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        {classData.is_cancelled && (
                          <div className="pb-2">
                            <Badge className="w-full text-center text-xs font-bold px-4 py-1 pointer-events-none" variant="destructive">
                              This class was cancelled.
                            </Badge>
                          </div>
                        )}
                        <div className={`flex flex-col relative z-10 ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-xl font-bold flex-1">{classData.class_name}</CardTitle>
                            <div className="flex flex-nowrap gap-2 shrink-0">
                              <Badge
                                variant={classData.mats_provided ? "secondary" : "outline"}
                                className={classData.mats_provided
                                  ? "bg-[#644874] text-white hover:bg-[#644874]/90 border-0 pointer-events-none"
                                  : "border-[#644874] text-[#644874] bg-transparent hover:bg-transparent hover:border-[#644874] hover:text-[#644874] dark:border-[#9d7fb0] dark:text-[#9d7fb0] dark:hover:bg-transparent dark:hover:border-[#9d7fb0] dark:hover:text-[#9d7fb0] whitespace-nowrap pointer-events-none"
                                }
                              >
                                {classData.mats_provided ? "Mats Provided" : "Bring Your Own Mat"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium mt-1">
                            <Calendar className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
                            <span>{new Date(classData.start_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
                            <span>{new Date(classData.start_time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })} - {new Date(classData.end_time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm mt-2">
                            <MapPin className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0] mt-0.5" />
                            <div className="flex flex-col">
                              <span>{classData.room_number}, {classData.buildings?.building_name}</span>
                              {googleMapsUrl && (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#644874] hover:text-[#553965] hover:underline text-xs dark:text-[#9d7fb0] dark:hover:text-[#b99cc9]"
                                >
                                  View on Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className={`pb-4 pt-0 relative z-10 ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpanded(registration.id)}
                          className="w-full justify-start text-muted-foreground hover:text-foreground mb-2 -ml-3"
                        >
                          {expandedCards.has(registration.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-sm">More Info</span>
                        </Button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedCards.has(registration.id)
                            ? 'max-h-96 opacity-100'
                            : 'max-h-0 opacity-0'
                            }`}
                        >
                          <div className="space-y-2 pb-1">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-5 w-5 text-[#644874] dark:text-[#9d7fb0]" />
                              <span>{classData.instructor_name}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                              <AlignLeft className="h-5 w-5 mt-0.5 flex-shrink-0 text-[#644874] dark:text-[#9d7fb0]" />
                              <p className="text-muted-foreground">{classData.class_description}</p>
                            </div>
                          </div>
                        </div>
                        {!classData.is_cancelled && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClick(registration.id, classData.id, classData.class_name)}
                              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/15"
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
              </div>

              {filteredUpcomingClasses.length > INITIAL_DISPLAY_COUNT && (
                <div className="flex justify-center pt-4">
                  {upcomingDisplayCount >= filteredUpcomingClasses.length ? (
                    <Button
                      variant="outline"
                      onClick={handleViewLessUpcoming}
                      className="gap-2 min-w-[200px]"
                    >
                      <ChevronUp className="h-4 w-4" />
                      View Less
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleViewMoreUpcoming}
                      className="gap-2 min-w-[200px]"
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

        <TabsContent value="past" className="w-full animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          {filteredPastClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-xl border-muted">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800/30 p-4 mb-4">
                <Calendar className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Class History</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your past classes will appear here after you attend them.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {displayedPastClasses.map((registration) => {
                  const classData = registration.yoga_classes;
                  const isRemoving = removingRegistrationIds.has(registration.id);
                  const googleMapsUrl = classData.buildings?.building_address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(classData.buildings.building_address)}`
                    : null;
                  return (
                    <Card
                      key={registration.id}
                      className={`relative overflow-hidden shadow-sm transition-all duration-500 ease-in-out bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/20 border border-slate-200 dark:border-slate-800 ${isRemoving
                        ? 'opacity-0 scale-95 max-h-0 mb-0 border-0 py-0'
                        : 'opacity-100 scale-100'
                        } hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700`}
                    >
                      <CardHeader className="pb-2 pt-4 px-6 relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-slate-200/20 to-slate-300/20 dark:from-slate-700/10 dark:to-slate-800/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <div className="flex flex-col relative z-10">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-xl font-bold flex-1 text-muted-foreground">{classData.class_name}</CardTitle>
                            <div className="flex flex-nowrap gap-2 shrink-0">
                              <Badge
                                variant={classData.mats_provided ? "secondary" : "outline"}
                                className={classData.mats_provided
                                  ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 pointer-events-none border-0"
                                  : "border-slate-300 text-slate-500 bg-transparent pointer-events-none"
                                }
                              >
                                {classData.mats_provided ? "Mats Provided" : "Bring Your Own Mat"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium mt-1">
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
                          <div className="flex items-start gap-2 text-sm mt-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex flex-col">
                              <span>{classData.room_number}, {classData.buildings?.building_name}</span>
                              {googleMapsUrl && (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#644874] hover:text-[#553965] hover:underline text-xs dark:text-[#9d7fb0] dark:hover:text-[#b99cc9]"
                                >
                                  View on Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className={`pb-4 pt-0 relative z-10 ${classData.is_cancelled ? 'opacity-50' : ''}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpanded(registration.id)}
                          className="w-full justify-start text-muted-foreground hover:text-foreground mb-2 -ml-3"
                        >
                          {expandedCards.has(registration.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-sm">More Info</span>
                        </Button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedCards.has(registration.id)
                            ? 'max-h-96 opacity-100'
                            : 'max-h-0 opacity-0'
                            }`}
                        >
                          <div className="space-y-2 pb-1">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span>{classData.instructor_name}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                              <AlignLeft className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                              <p className="text-muted-foreground">{classData.class_description}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredPastClasses.length > INITIAL_DISPLAY_COUNT && (
                <div className="flex justify-center pt-4">
                  {pastDisplayCount >= filteredPastClasses.length ? (
                    <Button
                      variant="outline"
                      onClick={handleViewLessPast}
                      className="gap-2 min-w-[200px]"
                    >
                      <ChevronUp className="h-4 w-4" />
                      View Less
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleViewMorePast}
                      className="gap-2 min-w-[200px]"
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
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              {isCanceling ? "Removing..." : "Yes, Remove Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
