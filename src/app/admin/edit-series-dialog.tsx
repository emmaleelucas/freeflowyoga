'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateSeries } from './actions';
import { toast } from 'sonner';

interface EditSeriesDialogProps {
    seriesData: {
        id: number;
        series_name: string;
        series_description: string;
        recurrence_pattern: string;
        recurrence_days: number[];
        start_time: string;
        end_time: string;
        instructor_name: string;
        room_id: number;
        mats_provided: boolean;
        is_active: boolean;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

export function EditSeriesDialog({ seriesData, open, onOpenChange, onSuccess }: EditSeriesDialogProps) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        seriesName: seriesData.series_name || '',
        seriesDescription: seriesData.series_description || '',
        recurrencePattern: seriesData.recurrence_pattern || 'weekly',
        selectedDays: seriesData.recurrence_days || [],
        startTime: seriesData.start_time || '',
        endTime: seriesData.end_time || '',
        instructorName: seriesData.instructor_name || '',
        isActive: seriesData.is_active ?? true,
    });

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
        setLoading(true);

        const result = await updateSeries(seriesData.id, {
            seriesName: formData.seriesName,
            seriesDescription: formData.seriesDescription,
        });

        if (result.success) {
            toast.success('Series updated');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to update');
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Series</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="seriesName">Series Name *</Label>
                        <Input
                            id="seriesName"
                            value={formData.seriesName}
                            onChange={(e) => setFormData({ ...formData, seriesName: e.target.value })}
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
                        <Label className="mb-2 block text-muted-foreground">Schedule (read-only)</Label>
                        <div className="flex gap-1">
                            {DAYS_OF_WEEK.map((day) => (
                                <Button
                                    key={day.value}
                                    type="button"
                                    variant={formData.selectedDays.includes(day.value) ? 'default' : 'outline'}
                                    size="sm"
                                    disabled
                                    className={`flex-1 ${formData.selectedDays.includes(day.value) ? 'bg-[#644874] hover:bg-[#553965]' : ''}`}
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                            <Label className="text-muted-foreground">Frequency</Label>
                            <p className="capitalize">{formData.recurrencePattern}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Time</Label>
                            <p>{formData.startTime} - {formData.endTime}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Instructor</Label>
                            <p>{formData.instructorName || 'Not set'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="active">Series Active</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-[#644874] hover:bg-[#553965]">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
