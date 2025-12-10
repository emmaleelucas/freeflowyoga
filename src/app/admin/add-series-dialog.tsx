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
import { createSeriesWithClasses } from './actions';
import { toast } from 'sonner';

interface AddSeriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type Building = {
    id: number;
    building_name: string;
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

export function AddSeriesDialog({ open, onOpenChange, onSuccess }: AddSeriesDialogProps) {
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);

    const [formData, setFormData] = useState({
        seriesName: '',
        seriesDescription: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        instructorName: '',
        buildingId: '',
        roomNumber: '',
        matsProvided: true,
        recurrencePattern: 'weekly',
        selectedDays: [] as number[],
    });

    useEffect(() => {
        if (open) {
            fetchBuildings();
        }
    }, [open]);

    async function fetchBuildings() {
        const supabase = createClient();
        const { data } = await supabase
            .from('buildings')
            .select('id, building_name')
            .order('building_name');

        if (data) setBuildings(data);
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

        if (formData.selectedDays.length === 0) {
            toast.error('Please select at least one day');
            return;
        }

        setLoading(true);

        const result = await createSeriesWithClasses({
            seriesName: formData.seriesName,
            seriesDescription: formData.seriesDescription,
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
            toast.success(`Series created with ${result.classCount} classes`);
            resetForm();
            onOpenChange(false);
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to create series');
        }

        setLoading(false);
    }

    function resetForm() {
        setFormData({
            seriesName: '',
            seriesDescription: '',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            instructorName: '',
            buildingId: '',
            roomNumber: '',
            matsProvided: true,
            recurrencePattern: 'weekly',
            selectedDays: [],
        });
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Series</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="seriesName">Series Name *</Label>
                        <Input
                            id="seriesName"
                            value={formData.seriesName}
                            onChange={(e) => setFormData({ ...formData, seriesName: e.target.value })}
                            placeholder="e.g., Noontime Yoga"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="seriesDescription">Description *</Label>
                        <Textarea
                            id="seriesDescription"
                            value={formData.seriesDescription}
                            onChange={(e) => setFormData({ ...formData, seriesDescription: e.target.value })}
                            rows={2}
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

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="recurrence">Frequency *</Label>
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
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="startTime">Start</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="endTime">End</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

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
                                required
                            />
                        </div>
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
                        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0]">
                            {loading ? 'Creating...' : 'Create Series'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
