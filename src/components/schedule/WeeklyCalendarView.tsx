"use client"

import type { YogaClass } from "@/lib/types"
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
    <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 border border-[#644874]/15 dark:border-[#644874]/25 rounded-2xl shadow-[0_8px_32px_rgba(100,72,116,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Fixed header row */}
      <div className="flex border-b border-[#644874]/15 dark:border-[#644874]/25 sticky top-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 z-10">
        {/* Empty corner for time column */}
        <div className="w-16 flex-shrink-0 border-r border-[#644874]/15 dark:border-[#644874]/25" />

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
                className="flex-1 border-r border-[#644874]/15 dark:border-[#644874]/25 last:border-r-0 h-16 px-2 pt-2 pb-0 text-center"
              >
                <div className={`text-xs font-semibold ${isToday ? 'text-[#644874] dark:text-[#9d7fb0]' : 'text-gray-600 dark:text-gray-400'}`}>
                  {dayNames[day.getDay()]}
                </div>
                <div className={`text-lg font-bold mt-0.5 ${isToday ? 'bg-gradient-to-r from-[#644874] to-[#6B92B5] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto shadow-md' : 'text-gray-700 dark:text-gray-300'}`}>
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
          <div className="w-16 flex-shrink-0 border-r border-[#644874]/15 dark:border-[#644874]/25 bg-white/30 dark:bg-gray-900/30">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className={`h-[60px] flex items-start justify-end pr-2 pt-1 text-xs font-medium text-[#644874] dark:text-[#9d7fb0] ${index < hours.length - 1 ? 'border-b border-[#644874]/10 dark:border-[#644874]/15' : ''}`}
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
                  className={`flex-1 border-r border-[#644874]/15 dark:border-[#644874]/25 last:border-r-0 ${isToday ? 'bg-[#644874]/5 dark:bg-[#644874]/10' : ''}`}
                >
                  {/* Time grid */}
                  <div className="relative">
                    {hours.map((hour, index) => (
                      <div
                        key={hour}
                        className={`h-[60px] ${index < hours.length - 1 ? 'border-b border-[#644874]/10 dark:border-[#644874]/15' : ''}`}
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
                            absolute left-1 right-1 rounded-lg px-2.5 py-1.5 text-xs text-left
                            overflow-hidden transition-all duration-300 cursor-pointer backdrop-blur-sm
                            ${yogaClass.isCancelled
                              ? 'bg-red-100/80 text-red-700 hover:bg-red-200/80 line-through dark:bg-red-900/40 dark:text-red-300 border border-red-200/50 dark:border-red-700/30'
                              : isPast
                              ? 'bg-gray-100/60 text-gray-500 hover:bg-gray-200/60 dark:bg-gray-700/30 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/30'
                              : 'bg-gradient-to-r from-[#644874] to-[#6B92B5] text-white hover:from-[#553965] hover:to-[#5A7FA0] shadow-md hover:shadow-lg'
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
    </div>
  )
}
