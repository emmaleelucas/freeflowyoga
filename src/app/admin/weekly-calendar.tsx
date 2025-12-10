'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ClassData = {
    id: number;
    class_name: string;
    class_description: string;
    start_time: string;
    end_time: string;
    instructor_name: string;
    is_cancelled: boolean;
    mats_provided: boolean;
    building_id: number;
    room_number: string;
    series_id: number | null;
    current_enrollment: number;
    buildings: {
        building_name: string;
    } | null;
    class_series: {
        series_name: string;
    } | null;
};

interface WeeklyCalendarProps {
    classes: ClassData[];
    onClassClick: (classData: ClassData) => void;
}

export function WeeklyCalendar({ classes, onClassClick }: WeeklyCalendarProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    // Get the start of the current week (Sunday)
    const getWeekStart = (offset: number) => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek + (offset * 7));
        start.setHours(0, 0, 0, 0);
        return start;
    };

    const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);

    // Generate array of 7 days for the week
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            days.push(date);
        }
        return days;
    }, [weekStart]);

    // Group classes by day of week
    const classesByDay = useMemo(() => {
        const grouped: { [key: number]: ClassData[] } = {
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };

        classes.forEach(classData => {
            const classDate = new Date(classData.start_time);
            // Check if class is in the current week view
            const classDateStr = classDate.toDateString();
            const weekDayIndex = weekDays.findIndex(d => d.toDateString() === classDateStr);
            if (weekDayIndex !== -1) {
                grouped[weekDayIndex].push(classData);
            }
        });

        // Sort each day's classes by start time
        Object.keys(grouped).forEach(key => {
            grouped[parseInt(key)].sort((a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
        });

        return grouped;
    }, [classes, weekDays]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const formatWeekRange = () => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });

        if (startMonth === endMonth) {
            return `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
        return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatWeekRange()}
                    </h2>
                    {weekOffset !== 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWeekOffset(0)}
                            className="text-[#644874]"
                        >
                            Today
                        </Button>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="gap-1"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date, dayIndex) => (
                    <div key={dayIndex} className="min-h-[400px]">
                        {/* Day Header */}
                        <div className={`text-center p-2 rounded-t-lg ${isToday(date)
                            ? 'bg-[#644874] text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                            <div className="text-xs font-medium uppercase">{dayNames[dayIndex]}</div>
                            <div className={`text-lg font-bold ${isToday(date) ? 'text-white' : 'text-slate-900 dark:text-white'
                                }`}>
                                {date.getDate()}
                            </div>
                        </div>

                        {/* Day Content */}
                        <Card className={`rounded-t-none border-t-0 min-h-[350px] p-2 space-y-2 ${isToday(date)
                            ? 'border-[#644874] bg-[#644874]/5'
                            : 'bg-white dark:bg-slate-800'
                            }`}>
                            {classesByDay[dayIndex].length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                                    No classes
                                </p>
                            ) : (
                                classesByDay[dayIndex].map((classData) => (
                                    <div
                                        key={classData.id}
                                        onClick={() => onClassClick(classData)}
                                        className={`p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${classData.is_cancelled
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                                            : 'bg-gradient-to-br from-[#644874]/10 to-[#6B92B5]/10 border border-[#644874]/20 hover:border-[#644874]/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-1 mb-1">
                                            <p className={`text-xs font-semibold line-clamp-2 ${classData.is_cancelled
                                                ? 'text-rose-600 dark:text-rose-400 line-through'
                                                : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {classData.class_name}
                                            </p>
                                            {classData.is_cancelled && (
                                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                                    X
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[#644874] dark:text-[#9d7fb0] font-medium">
                                            {formatTime(classData.start_time)}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            {classData.instructor_name}
                                        </p>
                                        {(classData.buildings?.building_name || classData.room_number) && (
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                                {classData.buildings?.building_name}{classData.buildings?.building_name && classData.room_number ? ', ' : ''}{classData.room_number}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
