"use client"

import { useState } from "react"
import type { YogaClass } from "@/lib/types"
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
    <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-[#644874]/15 dark:border-[#644874]/25 rounded-2xl shadow-lg p-5">
      <div className="grid grid-cols-7 gap-3">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-[#644874]/70 dark:text-[#9d7fb0]/70 py-2">
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
                min-h-[120px] p-2.5 rounded-xl text-sm transition-all duration-300
                ${!isInCurrentPeriod
                  ? "text-muted-foreground opacity-40 bg-gray-100/30 dark:bg-gray-800/20"
                  : "bg-white/50 dark:bg-gray-800/30 border border-[#644874]/10 dark:border-[#644874]/20"
                }
                ${isToday
                  ? "ring-2 ring-[#644874]/50 dark:ring-[#644874]/60 bg-[#644874]/5 dark:bg-[#644874]/15"
                  : ""
                }
              `}
            >
              <div className="flex flex-col h-full">
                <div className={`text-center mb-2 ${isToday ? "font-bold text-[#644874] dark:text-[#9d7fb0]" : "text-gray-700 dark:text-gray-300"}`}>
                  {day.getDate()}
                </div>

                {hasClasses && (
                  <div className="flex flex-col gap-1 flex-1">
                    {/* Show past classes toggle button for current day with upcoming classes only */}
                    {isTodayWithUpcoming && pastClassesForToday.length > 0 && (
                      <button
                        onClick={(e) => togglePastClasses(dateString, e)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#644874] dark:hover:text-[#9d7fb0] flex items-center justify-center gap-1 py-1 cursor-pointer transition-colors"
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

                    {/* Show past classes if toggled on (for current day with upcoming classes only) */}
                    {isTodayWithUpcoming && showPast && pastClassesForToday.map((yogaClass) => {
                      const isPast = isClassInPast(yogaClass)

                      return (
                        <button
                          key={yogaClass.id}
                          onClick={(e) => onClassClick(yogaClass, e)}
                          className={`
                            text-xs px-2.5 py-1.5 rounded-lg text-left transition-all duration-300 truncate cursor-pointer
                            ${yogaClass.isCancelled
                              ? "bg-red-50 text-red-600 hover:bg-red-100 line-through dark:bg-red-900/30 dark:text-red-400 border border-red-200/50 dark:border-red-800/30"
                              : isPast
                              ? "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700/40 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/30"
                              : "bg-[#644874] text-white hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965] shadow-sm"
                            }
                          `}
                        >
                          <div className="font-medium truncate">{formatTime(yogaClass.startTime)}</div>
                          <div className="truncate text-[10px] opacity-80">{yogaClass.className}</div>
                        </button>
                      )
                    })}

                    {/* Show upcoming classes or all classes for non-today days */}
                    {(isTodayWithUpcoming ? upcomingClassesToShow : displayClasses).map((yogaClass) => {
                      const isPast = isClassInPast(yogaClass)

                      return (
                        <button
                          key={yogaClass.id}
                          onClick={(e) => onClassClick(yogaClass, e)}
                          className={`
                            text-xs px-2.5 py-1.5 rounded-lg text-left transition-all duration-300 truncate cursor-pointer
                            ${yogaClass.isCancelled
                              ? "bg-red-50 text-red-600 hover:bg-red-100 line-through dark:bg-red-900/30 dark:text-red-400 border border-red-200/50 dark:border-red-800/30"
                              : isPast
                              ? "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700/40 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/30"
                              : "bg-[#644874] text-white hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965] shadow-sm"
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
                        className="text-xs text-[#644874] dark:text-[#9d7fb0] hover:text-[#553965] dark:hover:text-[#b99cc9] flex items-center justify-center gap-1 py-1 cursor-pointer transition-colors"
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
    </div>
  )
}
