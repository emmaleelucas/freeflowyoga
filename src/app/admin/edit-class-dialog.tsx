'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { updateClass } from './actions';
import { toast } from 'sonner';
import { AlertCircle, Repeat } from 'lucide-react';

interface EditClassDialogProps {
    classData: any;
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

export function EditClassDialog({ classData, open, onOpenChange, onSuccess }: EditClassDialogProps) {
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [timeError, setTimeError] = useState('');
    const [updateMode, setUpdateMode] = useState<'occurrence' | 'series'>('occurrence');

    const isRecurringClass = classData?.series_id != null;

    const [formData, setFormData] = useState({
        className: '',
        startDate: '',
        startTime: '',
        endTime: '',
        instructorName: '',
        classDescription: '',
        buildingId: '',
        roomNumber: '',
        seriesId: '',
        matsProvided: true,
    });

    useEffect(() => {
        if (open && classData) {
            fetchBuildingsAndSeries();
            setUpdateMode('occurrence');

            const startDate = new Date(classData.start_time);
            const endDate = new Date(classData.end_time);

            setFormData({
                className: classData.class_name || '',
                startDate: startDate.toISOString().split('T')[0],
                startTime: startDate.toTimeString().slice(0, 5),
                endTime: endDate.toTimeString().slice(0, 5),
                instructorName: classData.instructor_name || '',
                classDescription: classData.class_description || '',
                buildingId: classData.building_id?.toString() || '',
                roomNumber: classData.room_number || '',
                seriesId: classData.series_id?.toString() || '',
                matsProvided: classData.mats_provided ?? true,
            });
        }
    }, [open, classData]);

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

    const isFormValid = () => {
        if (updateMode === 'series') {
            return (
                formData.className.trim() !== '' &&
                formData.instructorName.trim() !== '' &&
                formData.buildingId !== '' &&
                formData.roomNumber.trim() !== '' &&
                formData.classDescription.trim() !== ''
            );
        }
        return (
            formData.className.trim() !== '' &&
            formData.instructorName.trim() !== '' &&
            formData.buildingId !== '' &&
            formData.roomNumber.trim() !== '' &&
            formData.startDate !== '' &&
            formData.startTime !== '' &&
            formData.endTime !== '' &&
            formData.classDescription.trim() !== '' &&
            !timeError
        );
    };

    async function fetchBuildingsAndSeries() {
        const supabase = createClient();

        const [buildingsResult, seriesResult] = await Promise.all([
            supabase.from('buildings').select('id, building_name').order('building_name'),
            supabase.from('class_series').select('id, series_name').order('series_name'),
        ]);

        if (buildingsResult.data) setBuildings(buildingsResult.data);
        if (seriesResult.data) setSeries(seriesResult.data);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (updateMode === 'occurrence' && timeError) {
            toast.error('Please fix the time error before submitting');
            return;
        }

        setLoading(true);

        if (updateMode === 'series' && classData.series_id) {
            const supabase = createClient();

            const { error } = await supabase
                .from('yoga_classes')
                .update({
                    class_name: formData.className,
                    instructor_name: formData.instructorName,
                    class_description: formData.classDescription,
                    building_id: parseInt(formData.buildingId),
                    room_number: formData.roomNumber.trim(),
                    mats_provided: formData.matsProvided,
                })
                .eq('series_id', classData.series_id)
                .gte('start_time', new Date().toISOString());

            if (error) {
                toast.error('Failed to update series classes');
            } else {
                toast.success('All future classes in series updated');
                onSuccess();
            }
        } else {
            const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
            const endDateTime = `${formData.startDate}T${formData.endTime}:00`;

            const result = await updateClass(classData.id, {
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
                toast.success('Class updated successfully');
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to update class');
            }
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    {isRecurringClass && (
                        <DialogDescription className="flex items-center gap-2">
                            <Badge className="bg-[#644874]">
                                <Repeat className="h-3 w-3 mr-1" />
                                Recurring Class
                            </Badge>
                        </DialogDescription>
                    )}
                </DialogHeader>

                {isRecurringClass && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">What would you like to update?</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={updateMode === 'occurrence' ? 'default' : 'outline'}
                                onClick={() => setUpdateMode('occurrence')}
                                className={updateMode === 'occurrence' ? 'bg-[#644874] hover:bg-[#553965]' : ''}
                            >
                                This Class Only
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={updateMode === 'series' ? 'default' : 'outline'}
                                onClick={() => setUpdateMode('series')}
                                className={updateMode === 'series' ? 'bg-[#644874] hover:bg-[#553965]' : ''}
                            >
                                All Future in Series
                            </Button>
                        </div>
                        {updateMode === 'series' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ This will update all future classes in this series. Date/time changes are not applied to series updates.
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="className">Class Name *</Label>
                        <Input
                            id="className"
                            value={formData.className}
                            onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="instructor">Instructor *</Label>
                        <Input
                            id="instructor"
                            value={formData.instructorName}
                            onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                            required
                        />
                    </div>

                    {updateMode === 'occurrence' && (
                        <>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                                        required
                                    />
                                </div>
                            </div>

                            {timeError && (
                                <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    {timeError}
                                </div>
                            )}
                        </>
                    )}

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
                            placeholder="e.g., 101, Studio A"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={formData.classDescription}
                            onChange={(e) => setFormData({ ...formData, classDescription: e.target.value })}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="mats"
                            checked={formData.matsProvided}
                            onCheckedChange={(checked) => setFormData({ ...formData, matsProvided: checked })}
                        />
                        <Label htmlFor="mats">Mats Provided</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !isFormValid()} className="bg-[#644874] hover:bg-[#553965]">
                            {loading
                                ? 'Updating...'
                                : updateMode === 'series'
                                    ? 'Update All in Series'
                                    : 'Update Class'
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
