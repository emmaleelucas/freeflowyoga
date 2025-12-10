'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import type { YogaClass } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDays } from "@/lib/utils"
import { ClassDetailsDialog } from "./ClassDetailsDialog"
import { WeeklyCalendarView } from "./WeeklyCalendarView"
import { MonthlyCalendarView } from "./MonthlyCalendarView"
import { checkUserRegistration } from "@/lib/actions"

type OldYogaClass = {
  id: number;
  className: string;
  startTime: Date;
  endTime: Date;
  instructorName: string;
  matsProvided: boolean;
  classDescription: string;
  roomName: string;
  buildingName: string;
  buildingAddress: string;
};

type CalendarProps = {
  upcomingClasses: OldYogaClass[];
  allClasses: OldYogaClass[];
  initialClassId?: number;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Transform old format to new format
function transformClasses(classes: OldYogaClass[]): YogaClass[] {
  return classes.map(c => {
    const startDate = new Date(c.startTime);
    const endDate = new Date(c.endTime);

    // Convert to Kansas timezone (America/Chicago - Central Time)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(startDate);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const startHours = parts.find(p => p.type === 'hour')?.value || '';
    const startMinutes = parts.find(p => p.type === 'minute')?.value || '';
    const localDate = `${year}-${month}-${day}`;

    const endParts = formatter.formatToParts(endDate);
    const endHours = endParts.find(p => p.type === 'hour')?.value || '';
    const endMinutes = endParts.find(p => p.type === 'minute')?.value || '';

    return {
      id: c.id,
      className: c.className,
      date: localDate,
      startTime: `${startHours}:${startMinutes}`,
      endTime: `${endHours}:${endMinutes}`,
      instructorName: c.instructorName,
      matsProvided: c.matsProvided,
      classDescription: c.classDescription,
      location: {
        room: c.roomName,
        building: c.buildingName,
        address: c.buildingAddress,
      }
    };
  });
}

export default function Calendar({ allClasses, initialClassId }: CalendarProps) {
  const classes = useMemo(() => transformClasses(allClasses), [allClasses])
  const canViewPast = true
  const isAdmin = false

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week">("week")
  const [registrationData, setRegistrationData] = useState<{
    isRegistered: boolean
    isAuthenticated: boolean
  } | null>(null)
  const hasOpenedInitialClassRef = useRef(false)

  // Open dialog for initial class if provided via URL and navigate to its week
  useEffect(() => {
    if (initialClassId && !hasOpenedInitialClassRef.current && classes.length > 0) {
      const classToOpen = classes.find(c => c.id === initialClassId)
      if (classToOpen) {
        hasOpenedInitialClassRef.current = true

        // Navigate calendar to the week containing this class
        const classDate = new Date(classToOpen.date)
        setCurrentDate(classDate)

        setSelectedClass(classToOpen)
        checkUserRegistration(classToOpen.id).then(regData => {
          setRegistrationData(regData)
          setShowDialog(true)
        })
      }
    }
  }, [initialClassId, classes])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthDays = getMonthDays(year, month)
  const today = new Date()

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1))

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const handleClassClick = async (yogaClass: YogaClass, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClass(yogaClass)

    // Fetch registration data before opening dialog
    const regData = await checkUserRegistration(yogaClass.id)
    setRegistrationData(regData)
    setShowDialog(true)
  }

  const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())
  const weekStart = getWeekStart(currentDate)
  const isPastWeek = weekStart < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const getDisplayTitle = () => {
    if (viewMode === "month") {
      return `${monthNames[month]} ${year}`
    } else {
      const weekDays = getWeekDays()
      const startDay = weekDays[0]
      const endDay = weekDays[6]

      if (startDay.getMonth() === endDay.getMonth()) {
        return `${monthNames[startDay.getMonth()]} ${startDay.getDate()} - ${endDay.getDate()}, ${startDay.getFullYear()}`
      } else {
        return `${monthNames[startDay.getMonth()]} ${startDay.getDate()} - ${monthNames[endDay.getMonth()]} ${endDay.getDate()}, ${startDay.getFullYear()}`
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">{getDisplayTitle()}</h2>
        <div className="flex gap-3">
          {/* Month/Week toggle - hidden for now but keeping component */}
          {false && (
            <div className="flex backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-[#644874]/20 dark:border-[#644874]/30 rounded-xl overflow-hidden shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date())
                  setViewMode("month")
                }}
                className={`!rounded-none h-full px-4 transition-all duration-300 ${viewMode === "month"
                  ? "bg-gradient-to-r from-[#644874] to-[#6B92B5] text-white hover:from-[#553965] hover:to-[#5A7FA0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#644874] dark:hover:text-[#9d7fb0] hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20"
                  }`}
              >
                Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date())
                  setViewMode("week")
                }}
                className={`!rounded-none h-full px-4 transition-all duration-300 ${viewMode === "week"
                  ? "bg-gradient-to-r from-[#644874] to-[#6B92B5] text-white hover:from-[#553965] hover:to-[#5A7FA0]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#644874] dark:hover:text-[#9d7fb0] hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20"
                  }`}
              >
                Week
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            {/* Today button - only show when not viewing current week */}
            {(() => {
              const todayWeekStart = getWeekStart(new Date())
              const currentWeekStart = getWeekStart(currentDate)
              const isCurrentWeek = todayWeekStart.toDateString() === currentWeekStart.toDateString()

              if (!isCurrentWeek) {
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-[#644874]/20 dark:border-[#644874]/30 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:border-[#644874]/40 dark:hover:border-[#644874]/50 transition-all duration-300 text-[#644874] dark:text-[#9d7fb0]"
                  >
                    Today
                  </Button>
                )
              }
              return null
            })()}

            <Button
              variant="outline"
              size="icon"
              onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
              disabled={!canViewPast && (viewMode === "month" ? isPastMonth : isPastWeek)}
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-[#644874]/20 dark:border-[#644874]/30 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:border-[#644874]/40 dark:hover:border-[#644874]/50 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-[#644874]/20 dark:border-[#644874]/30 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:border-[#644874]/40 dark:hover:border-[#644874]/50 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "week" ? (
        <WeeklyCalendarView
          weekDays={getWeekDays()}
          classes={classes}
          dayNames={dayNames}
          onClassClick={handleClassClick}
        />
      ) : (
        <MonthlyCalendarView
          monthDays={monthDays}
          currentMonth={month}
          classes={classes}
          dayNames={dayNames}
          onClassClick={handleClassClick}
        />
      )}

      {selectedClass && registrationData && (
        <ClassDetailsDialog
          classes={[selectedClass]}
          open={showDialog}
          onOpenChange={(open) => {
            setShowDialog(open)
            if (!open) {
              // Reset registration data when dialog closes
              setRegistrationData(null)
            }
          }}
          isAdmin={isAdmin}
          initialRegistrationData={registrationData}
        />
      )}
    </div>
  )
}
