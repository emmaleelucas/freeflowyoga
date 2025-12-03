'use client'

import { useState } from "react"
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

    // Format date in local timezone consistently
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const startHours = String(startDate.getHours()).padStart(2, '0');
    const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');

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

export default function Calendar({ allClasses }: CalendarProps) {
  const classes = transformClasses(allClasses)
  const canViewPast = true
  const isAdmin = false

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [registrationData, setRegistrationData] = useState<{
    isRegistered: boolean
    isAuthenticated: boolean
  } | null>(null)

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{getDisplayTitle()}</h2>
        <div className="flex gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setCurrentDate(new Date())
                setViewMode("month")
              }}
              className={viewMode === "month"
                ? "!rounded-none bg-purple-900 hover:bg-purple-900 h-full dark:bg-purple-700 dark:hover:bg-purple-700"
                : "!rounded-none h-full"
              }
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setCurrentDate(new Date())
                setViewMode("week")
              }}
              className={viewMode === "week"
                ? "!rounded-none bg-purple-900 hover:bg-purple-900 h-full dark:bg-purple-700 dark:hover:bg-purple-700"
                : "!rounded-none h-full"
              }
            >
              Week
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
            disabled={!canViewPast && (viewMode === "month" ? isPastMonth : isPastWeek)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
