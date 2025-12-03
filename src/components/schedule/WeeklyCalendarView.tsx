"use client"

import type { YogaClass } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { formatTime } from "@/lib/utils"

interface WeeklyCalendarViewProps {
  weekDays: Date[]
  classes: YogaClass[]
  dayNames: string[]
  onClassClick: (yogaClass: YogaClass, e: React.MouseEvent) => void
}

export function WeeklyCalendarView({
  weekDays,
  classes,
  dayNames,
  onClassClick,
}: WeeklyCalendarViewProps) {
  const today = new Date()
  const hours = Array.from({ length: 15 }, (_, i) => i + 6) // 6am to 8pm
  const hourHeight = 60 // pixels per hour

  const getClassesForDay = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return classes.filter((c) => c.date === dateString).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime)
    })
  }

  const getHourFromTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours + minutes / 60
  }

  const getClassDuration = (startTime: string, endTime: string) => {
    const startHour = getHourFromTime(startTime)
    const endHour = getHourFromTime(endTime)
    return endHour - startHour
  }

  const isClassInPast = (yogaClass: YogaClass) => {
    const now = new Date()
    const [year, month, day] = yogaClass.date.split('-').map(Number)
    const [hours, minutes] = yogaClass.startTime.split(':').map(Number)
    const classStartDateTime = new Date(year, month - 1, day, hours, minutes)
    return classStartDateTime < now
  }

  return (
    <Card className="p-0 overflow-hidden">
      {/* Fixed header row */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        {/* Empty corner for time column */}
        <div className="w-16 flex-shrink-0 border-r" />

        {/* Day headers */}
        <div className="flex-1 flex">
          {weekDays.map((day, dayIndex) => {
            const isToday =
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear()

            return (
              <div
                key={dayIndex}
                className="flex-1 border-r last:border-r-0 h-16 px-2 pt-2 pb-0 text-center"
              >
                <div className={`text-xs font-medium ${isToday ? 'text-purple-700 font-bold dark:text-purple-400' : ''}`}>
                  {dayNames[day.getDay()]}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto dark:bg-purple-600' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="overflow-auto max-h-[calc(100vh-330px)]">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className={`h-[60px] flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground ${index < hours.length - 1 ? 'border-b' : ''}`}
              >
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 flex">
            {weekDays.map((day, dayIndex) => {
              const dayClasses = getClassesForDay(day)
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear()

              return (
                <div
                  key={dayIndex}
                  className={`flex-1 border-r last:border-r-0 ${isToday ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}`}
                >
                  {/* Time grid */}
                  <div className="relative">
                    {hours.map((hour, index) => (
                      <div
                        key={hour}
                        className={`h-[60px] ${index < hours.length - 1 ? 'border-b' : ''}`}
                      />
                    ))}

                    {/* Classes positioned absolutely */}
                    {dayClasses.map((yogaClass) => {
                      const startHour = getHourFromTime(yogaClass.startTime)
                      const duration = getClassDuration(yogaClass.startTime, yogaClass.endTime)
                      const top = (startHour - 6) * hourHeight
                      const height = duration * hourHeight
                      const isPast = isClassInPast(yogaClass)

                      return (
                        <button
                          key={yogaClass.id}
                          onClick={(e) => onClassClick(yogaClass, e)}
                          className={`
                            absolute left-1 right-1 rounded px-2 py-1 text-xs text-left
                            overflow-hidden transition-colors cursor-pointer
                            ${yogaClass.isCancelled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200 line-through border-l-4 border-red-500 dark:bg-red-900 dark:text-red-200'
                              : isPast
                              ? 'bg-gray-300 text-gray-600 hover:bg-gray-400 border-l-4 border-gray-400 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-purple-900 text-white hover:bg-purple-700 border-l-4 border-purple-900 dark:bg-purple-700 dark:hover:bg-purple-600 dark:border-purple-700'
                            }
                          `}
                          style={{
                            top: `${top}px`,
                            height: `${height - 4}px`,
                          }}
                        >
                          <div className="font-semibold truncate">{yogaClass.className}</div>
                          <div className="text-[10px] opacity-90">
                            {formatTime(yogaClass.startTime)} - {formatTime(yogaClass.endTime)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
