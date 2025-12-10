'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

export async function cancelClass(classId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('yoga_classes')
            .update({ is_cancelled: true })
            .eq('id', classId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/schedule');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function uncancelClass(classId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('yoga_classes')
            .update({ is_cancelled: false })
            .eq('id', classId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/schedule');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function createClass(data: {
    className: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    classDescription: string;
    buildingId: number;
    roomNumber: string;
    seriesId?: number;
    matsProvided: boolean;
}) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('yoga_classes')
            .insert({
                class_name: data.className,
                start_time: data.startTime,
                end_time: data.endTime,
                instructor_name: data.instructorName,
                class_description: data.classDescription,
                building_id: data.buildingId,
                room_number: data.roomNumber,
                series_id: data.seriesId || null,
                mats_provided: data.matsProvided,
                is_cancelled: false,
            });

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/schedule');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function updateClass(classId: number, data: {
    className: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    classDescription: string;
    buildingId: number;
    roomNumber: string;
    seriesId?: number;
    matsProvided: boolean;
}) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('yoga_classes')
            .update({
                class_name: data.className,
                start_time: data.startTime,
                end_time: data.endTime,
                instructor_name: data.instructorName,
                class_description: data.classDescription,
                building_id: data.buildingId,
                room_number: data.roomNumber,
                series_id: data.seriesId || null,
                mats_provided: data.matsProvided,
            })
            .eq('id', classId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/schedule');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function createSeriesWithClasses(data: {
    seriesName: string;
    seriesDescription: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    buildingId: number;
    roomNumber: string;
    matsProvided: boolean;
    recurrencePattern: string;
    recurrenceDays: number[];
}) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        // First create the series
        const { data: seriesData, error: seriesError } = await supabase
            .from('class_series')
            .insert({
                series_name: data.seriesName,
                series_description: data.seriesDescription,
                recurrence_pattern: data.recurrencePattern,
                recurrence_days: data.recurrenceDays,
                start_time: data.startTime,
                end_time: data.endTime,
                instructor_name: data.instructorName,
                building_id: data.buildingId,
                room_number: data.roomNumber,
                mats_provided: data.matsProvided,
                series_start_date: data.startDate,
                series_end_date: data.endDate,
                is_active: true,
            })
            .select('id')
            .single();

        if (seriesError || !seriesData) {
            return { success: false, error: seriesError?.message || 'Failed to create series' };
        }

        // Generate all class instances
        const classInstances = [];
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        let currentDate = new Date(startDate);

        // Helper to check if we should add a class on this date
        const shouldAddClass = (date: Date, weekNumber: number) => {
            const dayOfWeek = date.getDay();
            if (!data.recurrenceDays.includes(dayOfWeek)) return false;

            if (data.recurrencePattern === 'weekly') return true;
            if (data.recurrencePattern === 'bi-weekly') return weekNumber % 2 === 0;
            if (data.recurrencePattern === 'monthly') {
                // Check if this is the first occurrence of this day in the month
                const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const firstDayWeekday = firstOfMonth.getDay();
                const daysUntilFirst = (dayOfWeek - firstDayWeekday + 7) % 7;
                const firstOccurrence = daysUntilFirst + 1;
                return date.getDate() === firstOccurrence;
            }
            return false;
        };

        let weekNumber = 0;
        let lastWeek = -1;

        while (currentDate <= endDate) {
            const currentWeek = Math.floor(currentDate.getTime() / (7 * 24 * 60 * 60 * 1000));
            if (currentWeek !== lastWeek) {
                weekNumber++;
                lastWeek = currentWeek;
            }

            if (shouldAddClass(currentDate, weekNumber)) {
                const dateStr = currentDate.toISOString().split('T')[0];
                classInstances.push({
                    series_id: seriesData.id,
                    class_name: data.seriesName,
                    class_description: data.seriesDescription,
                    start_time: `${dateStr}T${data.startTime}:00`,
                    end_time: `${dateStr}T${data.endTime}:00`,
                    instructor_name: data.instructorName,
                    building_id: data.buildingId,
                    room_number: data.roomNumber,
                    mats_provided: data.matsProvided,
                    is_cancelled: false,
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert all class instances
        if (classInstances.length > 0) {
            const { error: classesError } = await supabase
                .from('yoga_classes')
                .insert(classInstances);

            if (classesError) {
                return { success: false, error: classesError.message };
            }
        }

        revalidatePath('/admin');
        revalidatePath('/schedule');
        revalidatePath('/explore');

        return { success: true, classCount: classInstances.length };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function createSeries(data: {
    seriesName: string;
    seriesDescription: string;
}) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('class_series')
            .insert({
                series_name: data.seriesName,
                series_description: data.seriesDescription,
            });

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function updateSeries(seriesId: number, data: {
    seriesName: string;
    seriesDescription: string;
}) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('class_series')
            .update({
                series_name: data.seriesName,
                series_description: data.seriesDescription,
            })
            .eq('id', seriesId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function deleteSeries(seriesId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('class_series')
            .delete()
            .eq('id', seriesId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function deleteClass(classId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        const { error } = await supabase
            .from('yoga_classes')
            .delete()
            .eq('id', classId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function cancelSeriesClasses(seriesId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        // Cancel all future classes in the series
        const { error } = await supabase
            .from('yoga_classes')
            .update({ is_cancelled: true })
            .eq('series_id', seriesId)
            .gte('start_time', new Date().toISOString());

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}

export async function deleteSeriesClasses(seriesId: number) {
    try {
        await requireAdmin();

        const supabase = await createClient();

        // Delete all future classes in the series
        const { error } = await supabase
            .from('yoga_classes')
            .delete()
            .eq('series_id', seriesId)
            .gte('start_time', new Date().toISOString());

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/admin');
        revalidatePath('/explore');

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized or error occurred' };
    }
}
