"use client"

import { useState } from "react"
import type { YogaClass } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatTime } from "@/lib/utils"

interface MonthlyCalendarViewProps {
  monthDays: Date[]
  currentMonth: number
  classes: YogaClass[]
  dayNames: string[]
  onClassClick: (yogaClass: YogaClass, e: React.MouseEvent) => void
}

export function MonthlyCalendarView({
  monthDays,
  currentMonth,
  classes,
  dayNames,
  onClassClick,
}: MonthlyCalendarViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [showPastClasses, setShowPastClasses] = useState<Set<string>>(new Set())

  const today = new Date()
  const maxClassesToShow = 2

  const getClassesForDay = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return classes.filter((c) => c.date === dateString).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime)
    })
  }

  const isClassInPast = (yogaClass: YogaClass) => {
    const now = new Date()
    const [year, month, day] = yogaClass.date.split('-').map(Number)
    const [hours, minutes] = yogaClass.startTime.split(':').map(Number)
    const classStartDateTime = new Date(year, month - 1, day, hours, minutes)
    return classStartDateTime < now
  }

  const toggleDayExpansion = (dateString: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dateString)) {
        newSet.delete(dateString)
      } else {
        newSet.add(dateString)
      }
      return newSet
    })
  }

  const togglePastClasses = (dateString: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPastClasses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dateString)) {
        newSet.delete(dateString)
      } else {
        newSet.add(dateString)
      }
      return newSet
    })
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {monthDays.map((day, index) => {
          const isInCurrentPeriod = day.getMonth() === currentMonth
          const dayClasses = getClassesForDay(day)
          const hasClasses = dayClasses.length > 0
          const isToday =
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()

          const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
          const isExpanded = expandedDays.has(dateString)
          const showPast = showPastClasses.has(dateString)

          // For current day only, separate past and upcoming classes
          let pastClassesForToday: typeof dayClasses = []
          let upcomingClassesForToday: typeof dayClasses = []
          let upcomingClassesToShow: typeof dayClasses = []
          let isTodayWithUpcoming = false

          if (isToday) {
            pastClassesForToday = dayClasses.filter(c => isClassInPast(c))
            upcomingClassesForToday = dayClasses.filter(c => !isClassInPast(c))

            // If all classes have passed, treat like a regular day
            isTodayWithUpcoming = upcomingClassesForToday.length > 0

            if (isTodayWithUpcoming) {
              // Determine which upcoming classes to show
              upcomingClassesToShow = isExpanded
                ? upcomingClassesForToday
                : upcomingClassesForToday.slice(0, maxClassesToShow)
            }
          }

          const displayClasses = !isToday || !isTodayWithUpcoming
            ? (isExpanded ? dayClasses : dayClasses.slice(0, maxClassesToShow))
            : []

          // For today with upcoming: hasMore if there are more upcoming classes than shown
          // For other days or today without upcoming: hasMore if total classes exceed maxClassesToShow
          const hasMore = isTodayWithUpcoming
            ? upcomingClassesForToday.length > upcomingClassesToShow.length
            : dayClasses.length > maxClassesToShow

          return (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 rounded-lg text-sm transition-colors border
                ${!isInCurrentPeriod ? "text-muted-foreground opacity-40 bg-muted/20" : "bg-background"}
                ${isToday ? "border-2 border-purple-900 dark:border-purple-700" : "border-border"}
              `}
            >
              <div className="flex flex-col h-full">
                <div className={`text-center mb-1 ${isToday ? "font-bold" : ""}`}>
                  {day.getDate()}
                </div>

                {hasClasses && (
                  <div className="flex flex-col gap-1 flex-1">
                    {/* Show past classes if toggled on (for current day with upcoming classes only) */}
                    {isTodayWithUpcoming && showPast && pastClassesForToday.map((yogaClass) => {
                      const isPast = isClassInPast(yogaClass)

                      return (
                        <button
                          key={yogaClass.id}
                          onClick={(e) => onClassClick(yogaClass, e)}
                          className={`
                            text-xs px-2 py-1 rounded text-left transition-colors truncate cursor-pointer
                            ${yogaClass.isCancelled
                              ? "bg-red-100 text-red-800 hover:bg-red-200 line-through dark:bg-red-900 dark:text-red-200"
                              : isPast
                              ? "bg-gray-300 text-gray-600 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-purple-900 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                            }
                          `}
                        >
                          <div className="font-medium truncate">{formatTime(yogaClass.startTime)}</div>
                          <div className="truncate text-[10px] opacity-80">{yogaClass.className}</div>
                        </button>
                      )
                    })}

                    {/* Show past classes toggle button for current day with upcoming classes only */}
                    {isTodayWithUpcoming && pastClassesForToday.length > 0 && (
                      <button
                        onClick={(e) => togglePastClasses(dateString, e)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 cursor-pointer"
                      >
                        {showPast ? (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            <span>Hide past</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            <span>+{pastClassesForToday.length} past</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Show upcoming classes or all classes for non-today days */}
                    {(isTodayWithUpcoming ? upcomingClassesToShow : displayClasses).map((yogaClass) => {
                      const isPast = isClassInPast(yogaClass)

                      return (
                        <button
                          key={yogaClass.id}
                          onClick={(e) => onClassClick(yogaClass, e)}
                          className={`
                            text-xs px-2 py-1 rounded text-left transition-colors truncate cursor-pointer
                            ${yogaClass.isCancelled
                              ? "bg-red-100 text-red-800 hover:bg-red-200 line-through dark:bg-red-900 dark:text-red-200"
                              : isPast
                              ? "bg-gray-300 text-gray-600 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-purple-900 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                            }
                          `}
                        >
                          <div className="font-medium truncate">{formatTime(yogaClass.startTime)}</div>
                          <div className="truncate text-[10px] opacity-80">{yogaClass.className}</div>
                        </button>
                      )
                    })}

                    {hasMore && (
                      <button
                        onClick={(e) => toggleDayExpansion(dateString, e)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            <span>Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            <span>+{isTodayWithUpcoming ? (upcomingClassesForToday.length - upcomingClassesToShow.length) : (dayClasses.length - maxClassesToShow)} more</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
