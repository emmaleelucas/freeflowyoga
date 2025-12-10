'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { createClass, createSeriesWithClasses } from './actions';
import { toast } from 'sonner';
import { Repeat, AlertCircle } from 'lucide-react';

interface AddClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type Building = {
    id: number;
    building_name: string;
};

type Series = {
    id: number;
    series_name: string;
};

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

export function AddClassDialog({ open, onOpenChange, onSuccess }: AddClassDialogProps) {
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [timeError, setTimeError] = useState('');

    // Common form data
    const [formData, setFormData] = useState({
        className: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        instructorName: '',
        classDescription: '',
        buildingId: '',
        roomNumber: '',
        seriesId: '',
        matsProvided: true,
        recurrencePattern: 'weekly',
        selectedDays: [] as number[],
    });

    useEffect(() => {
        if (open) {
            fetchBuildingsAndSeries();
        }
    }, [open]);

    // Time validation
    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
            const [endHours, endMinutes] = formData.endTime.split(':').map(Number);

            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            const durationMinutes = endTotalMinutes - startTotalMinutes;

            if (durationMinutes <= 0) {
                setTimeError('End time must be after start time');
            } else if (durationMinutes < 30) {
                setTimeError('Class must be at least 30 minutes long');
            } else if (durationMinutes > 120) {
                setTimeError('Class cannot be longer than 2 hours');
            } else {
                setTimeError('');
            }
        } else {
            setTimeError('');
        }
    }, [formData.startTime, formData.endTime]);

    // Check if form is valid
    const isFormValid = () => {
        // Common required fields
        const commonFieldsValid =
            formData.className.trim() !== '' &&
            formData.instructorName.trim() !== '' &&
            formData.buildingId !== '' &&
            formData.roomNumber.trim() !== '' &&
            formData.startDate !== '' &&
            formData.startTime !== '' &&
            formData.endTime !== '' &&
            formData.classDescription.trim() !== '' &&
            !timeError;

        if (isRecurring) {
            // Recurring classes also need end date and at least one day selected
            return commonFieldsValid &&
                formData.endDate !== '' &&
                formData.selectedDays.length > 0;
        }

        return commonFieldsValid;
    };

    async function fetchBuildingsAndSeries() {
        const supabase = createClient();

        const [buildingsResult, seriesResult] = await Promise.all([
            supabase.from('buildings').select('id, building_name').order('building_name'),
            supabase.from('class_series').select('id, series_name').eq('is_active', true).order('series_name'),
        ]);

        if (buildingsResult.data) setBuildings(buildingsResult.data);
        if (seriesResult.data) setSeries(seriesResult.data);
    }

    function toggleDay(dayValue: number) {
        setFormData(prev => ({
            ...prev,
            selectedDays: prev.selectedDays.includes(dayValue)
                ? prev.selectedDays.filter(d => d !== dayValue)
                : [...prev.selectedDays, dayValue].sort((a, b) => a - b)
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validate times
        if (timeError) {
            toast.error('Please fix the time error before submitting');
            return;
        }

        // Validate building and room
        if (!formData.buildingId) {
            toast.error('Please select a building');
            return;
        }
        if (!formData.roomNumber.trim()) {
            toast.error('Please enter a room number');
            return;
        }

        if (isRecurring) {
            // Validate recurring class
            if (formData.selectedDays.length === 0) {
                toast.error('Please select at least one day for the recurring class');
                return;
            }
            if (!formData.endDate) {
                toast.error('Please select an end date for the series');
                return;
            }
        }

        setLoading(true);

        if (isRecurring) {
            // Create a recurring series
            const result = await createSeriesWithClasses({
                seriesName: formData.className,
                seriesDescription: formData.classDescription,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                instructorName: formData.instructorName,
                buildingId: parseInt(formData.buildingId),
                roomNumber: formData.roomNumber.trim(),
                matsProvided: formData.matsProvided,
                recurrencePattern: formData.recurrencePattern,
                recurrenceDays: formData.selectedDays,
            });

            if (result.success) {
                toast.success(`Recurring series created with ${result.classCount} classes`);
                resetForm();
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to create series');
            }
        } else {
            // Create a single class
            const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
            const endDateTime = `${formData.startDate}T${formData.endTime}:00`;

            const result = await createClass({
                className: formData.className,
                startTime: startDateTime,
                endTime: endDateTime,
                instructorName: formData.instructorName,
                classDescription: formData.classDescription,
                buildingId: parseInt(formData.buildingId),
                roomNumber: formData.roomNumber.trim(),
                seriesId: formData.seriesId && formData.seriesId !== 'none' ? parseInt(formData.seriesId) : undefined,
                matsProvided: formData.matsProvided,
            });

            if (result.success) {
                toast.success('Class created successfully');
                resetForm();
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to create class');
            }
        }

        setLoading(false);
    }

    function resetForm() {
        setFormData({
            className: '',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            instructorName: '',
            classDescription: '',
            buildingId: '',
            roomNumber: '',
            seriesId: '',
            matsProvided: true,
            recurrencePattern: 'weekly',
            selectedDays: [],
        });
        setIsRecurring(false);
        setTimeError('');
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Recurring Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#644874]/10 to-[#6B92B5]/10 border border-[#644874]/20">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isRecurring ? 'bg-[#6B92B5]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <Repeat className={`h-4 w-4 ${isRecurring ? 'text-white' : 'text-slate-500'}`} />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Recurring Class</p>
                                <p className="text-xs text-muted-foreground">
                                    {isRecurring ? 'This class will repeat on a schedule' : 'This is a one-time class'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                        />
                    </div>

                    {/* Class Name */}
                    <div>
                        <Label htmlFor="className">Class Name *</Label>
                        <Input
                            id="className"
                            value={formData.className}
                            onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                            placeholder="e.g., Morning Yoga Flow"
                            required
                        />
                    </div>

                    {/* Instructor */}
                    <div>
                        <Label htmlFor="instructor">Instructor *</Label>
                        <Input
                            id="instructor"
                            value={formData.instructorName}
                            onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                            placeholder="Enter instructor name"
                            required
                        />
                    </div>

                    {/* Building and Room - stacked to avoid overflow */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="building">Building *</Label>
                            <Select value={formData.buildingId} onValueChange={(value) => setFormData({ ...formData, buildingId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select building" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buildings.map((building) => (
                                        <SelectItem key={building.id} value={building.id.toString()}>
                                            {building.building_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="roomNumber">Room Number *</Label>
                            <Input
                                id="roomNumber"
                                value={formData.roomNumber}
                                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                placeholder="e.g., Room 002"
                                required
                            />
                        </div>
                    </div>

                    {/* Recurring-specific fields */}
                    {isRecurring && (
                        <>
                            <div>
                                <Label className="mb-2 block">Repeat on Days *</Label>
                                <div className="flex gap-1">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <Button
                                            key={day.value}
                                            type="button"
                                            variant={formData.selectedDays.includes(day.value) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => toggleDay(day.value)}
                                            className={`flex-1 ${formData.selectedDays.includes(day.value) ? 'bg-[#644874] hover:bg-[#553965]' : ''}`}
                                        >
                                            {day.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="recurrence">Frequency</Label>
                                <Select value={formData.recurrencePattern} onValueChange={(value) => setFormData({ ...formData, recurrencePattern: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* Date fields */}
                    {isRecurring ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    min={formData.startDate}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Label htmlFor="startDate">Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {/* Time fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className={timeError ? 'border-rose-500' : ''}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className={timeError ? 'border-rose-500' : ''}
                                required
                            />
                        </div>
                    </div>

                    {/* Time Error */}
                    {timeError && (
                        <div className="flex items-center gap-2 text-rose-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {timeError}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.classDescription}
                            onChange={(e) => setFormData({ ...formData, classDescription: e.target.value })}
                            rows={2}
                            required
                        />
                    </div>

                    {/* Mats Provided */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="mats"
                            checked={formData.matsProvided}
                            onCheckedChange={(checked) => setFormData({ ...formData, matsProvided: checked })}
                        />
                        <Label htmlFor="mats">Mats Provided</Label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !isFormValid()}
                            className={isRecurring
                                ? 'bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0]'
                                : 'bg-[#644874] hover:bg-[#553965]'
                            }
                        >
                            {loading
                                ? (isRecurring ? 'Creating Series...' : 'Creating...')
                                : (isRecurring ? 'Create Recurring Class' : 'Create Class')
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
