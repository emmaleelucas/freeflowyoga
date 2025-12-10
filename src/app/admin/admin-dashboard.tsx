'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    CalendarDays,
    Users,
    Layers,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Clock,
    MapPin,
    MoreHorizontal,
    Edit,
    XCircle,
    CheckCircle,
    Trash2,
    CalendarPlus,
    TrendingUp,
    Repeat,
    Info,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cancelClass, uncancelClass, deleteSeries, deleteClass, cancelSeriesClasses, deleteSeriesClasses } from './actions';
import { AddClassDialog } from './add-class-dialog';
import { EditClassDialog } from './edit-class-dialog';
import { EditSeriesDialog } from './edit-series-dialog';
import { WeeklyCalendar } from './weekly-calendar';

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
        recurrence_days?: number[];
        series_end_date?: string;
    } | null;
};

type SeriesData = {
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

type Stats = {
    totalClasses: number;
    upcomingClasses: number;
    totalSeries: number;
    totalEnrollments: number;
};

export function AdminDashboard() {
    const [activeView, setActiveView] = useState<'overview' | 'classes' | 'series' | 'calendar'>('overview');
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [series, setSeries] = useState<SeriesData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalClasses: 0, upcomingClasses: 0, totalSeries: 0, totalEnrollments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog states
    const [showAddClass, setShowAddClass] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassData | null>(null);
    const [editingSeries, setEditingSeries] = useState<SeriesData | null>(null);
    const [cancellingClass, setCancellingClass] = useState<ClassData | null>(null);
    const [deletingSeriesData, setDeletingSeriesData] = useState<SeriesData | null>(null);
    const [deletingClass, setDeletingClass] = useState<ClassData | null>(null);
    const [cancellingSeriesClasses, setCancellingSeriesClasses] = useState<ClassData | null>(null);
    const [deletingSeriesClasses, setDeletingSeriesClasses] = useState<ClassData | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
    const [visibleClassesCount, setVisibleClassesCount] = useState(5);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const supabase = createClient();

        // Fetch classes
        const { data: classesData } = await supabase
            .from('yoga_classes')
            .select(`
                id, class_name, class_description, start_time, end_time,
                instructor_name, is_cancelled, mats_provided, building_id, room_number, series_id, current_enrollment,
                buildings (building_name),
                class_series (series_name, recurrence_days, series_end_date)
            `)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(100);

        // Fetch series
        const { data: seriesData } = await supabase
            .from('class_series')
            .select('*')
            .eq('is_active', true)
            .order('series_name');

        // Calculate stats
        const now = new Date();
        const upcomingClasses = (classesData || []).filter(c =>
            new Date(c.start_time) > now && !c.is_cancelled
        ).length;

        const totalEnrollments = (classesData || []).reduce((sum, c) => sum + (c.current_enrollment || 0), 0);

        setClasses((classesData as unknown as ClassData[]) || []);
        setSeries((seriesData as unknown as SeriesData[]) || []);
        setStats({
            totalClasses: (classesData || []).length,
            upcomingClasses,
            totalSeries: (seriesData || []).length,
            totalEnrollments,
        });
        setLoading(false);
    }

    async function handleCancelClass() {
        if (!cancellingClass) return;
        setProcessingId(cancellingClass.id);

        const result = await cancelClass(cancellingClass.id);
        if (result.success) {
            toast.success('Class cancelled');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to cancel');
        }

        setProcessingId(null);
        setCancellingClass(null);
    }

    async function handleUncancelClass(classData: ClassData) {
        setProcessingId(classData.id);
        const result = await uncancelClass(classData.id);

        if (result.success) {
            toast.success('Class reactivated');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to reactivate');
        }

        setProcessingId(null);
    }

    async function handleDeleteSeries() {
        if (!deletingSeriesData) return;
        setProcessingId(deletingSeriesData.id);

        const result = await deleteSeries(deletingSeriesData.id);
        if (result.success) {
            toast.success('Series deleted');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to delete');
        }

        setProcessingId(null);
        setDeletingSeriesData(null);
    }

    async function handleDeleteClass() {
        if (!deletingClass) return;
        setProcessingId(deletingClass.id);

        const result = await deleteClass(deletingClass.id);
        if (result.success) {
            toast.success('Class deleted');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to delete class');
        }

        setProcessingId(null);
        setDeletingClass(null);
    }

    async function handleCancelSeriesClasses() {
        if (!cancellingSeriesClasses?.series_id) return;
        setProcessingId(cancellingSeriesClasses.series_id);

        const result = await cancelSeriesClasses(cancellingSeriesClasses.series_id);
        if (result.success) {
            toast.success('All future classes in series cancelled');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to cancel series classes');
        }

        setProcessingId(null);
        setCancellingSeriesClasses(null);
    }

    async function handleDeleteSeriesClasses() {
        if (!deletingSeriesClasses?.series_id) return;
        setProcessingId(deletingSeriesClasses.series_id);

        const result = await deleteSeriesClasses(deletingSeriesClasses.series_id);
        if (result.success) {
            toast.success('All future classes in series deleted');
            fetchData();
        } else {
            toast.error(result.error || 'Failed to delete series classes');
        }

        setProcessingId(null);
        setDeletingSeriesClasses(null);
    }

    const filteredClasses = classes.filter(c =>
        c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const visibleClasses = filteredClasses.slice(0, visibleClassesCount);
    const hasMoreClasses = filteredClasses.length > visibleClassesCount;

    const filteredSeries = series.filter(s =>
        s.series_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getDayName = (dayNum: number) => {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-slate-600 dark:text-slate-400">Manage your yoga classes and series</p>
                    </div>
                    <Button
                        onClick={() => setShowAddClass(true)}
                        className="bg-gradient-to-r from-[#644874] to-[#7B5C8B] hover:from-[#553965] hover:to-[#6A4B7A] shadow-lg"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Class
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveView('classes')}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming Classes</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.upcomingClasses}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#644874] to-[#7B5C8B] flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveView('series')}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Series</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalSeries}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#6B92B5] to-[#8AB4D8] flex items-center justify-center">
                                    <Layers className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Enrollments</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalEnrollments}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Classes</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalClasses}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
                        { id: 'classes', label: 'Classes', icon: Calendar },
                        { id: 'series', label: 'Series', icon: Layers },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as typeof activeView)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeView === tab.id
                                ? 'border-[#644874] text-[#644874]'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                {(activeView === 'classes' || activeView === 'series') && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={`Search ${activeView}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                )}

                {/* Content */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming Classes */}
                        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                                    <CardDescription>Next 5 scheduled classes</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setActiveView('classes')}>
                                    View All <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {classes.filter(c => !c.is_cancelled).slice(0, 5).map((classData) => (
                                    <div
                                        key={classData.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        onClick={() => setEditingClass(classData)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#644874] to-[#7B5C8B] flex items-center justify-center text-white text-xs font-bold">
                                                {new Date(classData.start_time).getDate()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{classData.class_name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatTime(classData.start_time)} • {classData.instructor_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {classData.current_enrollment} enrolled
                                        </Badge>
                                    </div>
                                ))}
                                {classes.filter(c => !c.is_cancelled).length === 0 && (
                                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">No upcoming classes</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Active Series */}
                        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg">Active Series</CardTitle>
                                    <CardDescription>Recurring class templates</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setActiveView('series')}>
                                    View All <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {series.slice(0, 5).map((seriesData) => (
                                    <div
                                        key={seriesData.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        onClick={() => setEditingSeries(seriesData)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6B92B5] to-[#8AB4D8] flex items-center justify-center">
                                                <Layers className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{seriesData.series_name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {seriesData.recurrence_pattern} • {seriesData.recurrence_days?.map(d => getDayName(d)).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {series.length === 0 && (
                                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">No active series</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Calendar View */}
                {activeView === 'calendar' && (
                    <WeeklyCalendar
                        classes={classes}
                        onClassClick={(classData) => setEditingClass(classData)}
                    />
                )}

                {/* Classes View */}
                {activeView === 'classes' && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {visibleClasses.map((classData) => (
                                    <div key={classData.id}>
                                        <div
                                            className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${classData.is_cancelled ? 'opacity-60' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${classData.is_cancelled
                                                    ? 'bg-slate-400'
                                                    : classData.series_id
                                                        ? 'bg-gradient-to-br from-[#6B92B5] to-[#8AB4D8]'
                                                        : 'bg-gradient-to-br from-[#644874] to-[#7B5C8B]'
                                                    }`}>
                                                    <div className="text-center">
                                                        <div className="text-xs opacity-80">
                                                            {new Date(classData.start_time).toLocaleDateString('en-US', { month: 'short' })}
                                                        </div>
                                                        <div>{new Date(classData.start_time).getDate()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-medium text-slate-900 dark:text-white ${classData.is_cancelled ? 'line-through' : ''}`}>
                                                            {classData.class_name}
                                                        </p>
                                                        {classData.is_cancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
                                                        {classData.series_id && (
                                                            <Badge className="text-xs gap-1 bg-[#644874] hover:bg-[#553965]">
                                                                <Repeat className="h-3 w-3" />
                                                                Recurring
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {classData.buildings?.building_name}, {classData.room_number}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {classData.current_enrollment} enrolled
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedClassId(expandedClassId === classData.id ? null : classData.id)}
                                                    className="gap-1 text-slate-500"
                                                >
                                                    <Info className="h-4 w-4" />
                                                    <span className="hidden sm:inline">More Info</span>
                                                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedClassId === classData.id ? 'rotate-180' : ''}`} />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={processingId === classData.id}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditingClass(classData)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit Class
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {classData.is_cancelled ? (
                                                            <DropdownMenuItem onClick={() => handleUncancelClass(classData)} className="text-green-600">
                                                                <CheckCircle className="h-4 w-4 mr-2" /> Reactivate Class
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => setCancellingClass(classData)} className="text-amber-600">
                                                                <XCircle className="h-4 w-4 mr-2" /> Cancel Class
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setDeletingClass(classData)} className="text-rose-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Class
                                                        </DropdownMenuItem>
                                                        {classData.series_id && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setCancellingSeriesClasses(classData)} className="text-amber-600">
                                                                    <XCircle className="h-4 w-4 mr-2" /> Cancel All in Series
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setDeletingSeriesClasses(classData)} className="text-rose-600">
                                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete All in Series
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        {/* Expanded Info Section */}
                                        {expandedClassId === classData.id && (
                                            <div className="border-t border-slate-200 dark:border-slate-700">
                                                <div className="p-4 pl-20 bg-slate-50/50 dark:bg-slate-800/50">
                                                    {/* Info Grid */}
                                                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                                                        {/* Instructor */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-[#644874]/10 flex items-center justify-center">
                                                                <Users className="h-4 w-4 text-[#644874]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Instructor</p>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{classData.instructor_name}</p>
                                                            </div>
                                                        </div>

                                                        {/* Day of Week */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-[#6B92B5]/10 flex items-center justify-center">
                                                                <Calendar className="h-4 w-4 text-[#6B92B5]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Day</p>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {new Date(classData.start_time).toLocaleDateString('en-US', { weekday: 'long' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Mats */}
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${classData.mats_provided ? 'bg-emerald-500/10' : 'bg-slate-200 dark:bg-slate-700'
                                                                }`}>
                                                                <CheckCircle className={`h-4 w-4 ${classData.mats_provided ? 'text-emerald-600' : 'text-slate-400'
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Mats</p>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {classData.mats_provided ? 'Provided' : 'Bring your own'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Series Info */}
                                                        {classData.class_series && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-[#644874]/10 flex items-center justify-center">
                                                                    <Repeat className="h-4 w-4 text-[#644874]" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Series End Date</p>
                                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                        {classData.class_series.series_end_date
                                                                            ? new Date(classData.class_series.series_end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                            : 'No end date'
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    {classData.class_description && (
                                                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                                {classData.class_description}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredClasses.length === 0 && (
                                    <div className="text-center py-12">
                                        <CalendarPlus className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">No classes found</p>
                                        <Button onClick={() => setShowAddClass(true)} className="mt-4" variant="outline">
                                            <Plus className="h-4 w-4 mr-2" /> Add First Class
                                        </Button>
                                    </div>
                                )}
                                {hasMoreClasses && (
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setVisibleClassesCount(prev => prev + 5)}
                                        >
                                            View More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Series View */}
                {activeView === 'series' && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredSeries.map((seriesData) => (
                                    <div
                                        key={seriesData.id}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6B92B5] to-[#8AB4D8] flex items-center justify-center">
                                                <Layers className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{seriesData.series_name}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    <span className="capitalize">{seriesData.recurrence_pattern}</span>
                                                    <span>{seriesData.recurrence_days?.map(d => getDayName(d)).join(', ')}</span>
                                                    <span>{seriesData.start_time} - {seriesData.end_time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={processingId === seriesData.id}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingSeries(seriesData)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setDeletingSeriesData(seriesData)} className="text-rose-600">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                                {filteredSeries.length === 0 && (
                                    <div className="text-center py-12">
                                        <Layers className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">No series found</p>
                                        <Button onClick={() => setShowAddClass(true)} className="mt-4" variant="outline">
                                            <Plus className="h-4 w-4 mr-2" /> Create Recurring Class
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Dialogs */}
            <AddClassDialog
                open={showAddClass}
                onOpenChange={setShowAddClass}
                onSuccess={fetchData}
            />

            {editingClass && (
                <EditClassDialog
                    classData={editingClass}
                    open={!!editingClass}
                    onOpenChange={(open: boolean) => !open && setEditingClass(null)}
                    onSuccess={() => {
                        fetchData();
                        setEditingClass(null);
                    }}
                />
            )}

            {editingSeries && (
                <EditSeriesDialog
                    seriesData={editingSeries}
                    open={!!editingSeries}
                    onOpenChange={(open: boolean) => !open && setEditingSeries(null)}
                    onSuccess={() => {
                        fetchData();
                        setEditingSeries(null);
                    }}
                />
            )}

            {/* Cancel Class Confirmation */}
            <AlertDialog open={!!cancellingClass} onOpenChange={(open) => !open && setCancellingClass(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Class</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel &quot;{cancellingClass?.class_name}&quot;?
                            <span className="block mt-2 text-amber-600 font-medium">
                                Registered students will be notified.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Class</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelClass} className="bg-rose-600 hover:bg-rose-700">
                            Cancel Class
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Series Confirmation */}
            <AlertDialog open={!!deletingSeriesData} onOpenChange={(open) => !open && setDeletingSeriesData(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Series</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingSeriesData?.series_name}&quot;?
                            <span className="block mt-2 text-amber-600 font-medium">
                                This will not delete existing classes in this series.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Series</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSeries} className="bg-rose-600 hover:bg-rose-700">
                            Delete Series
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Class Confirmation */}
            <AlertDialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &quot;{deletingClass?.class_name}&quot;?
                            <span className="block mt-2 text-rose-600 font-medium">
                                This action cannot be undone. All enrollment data will be lost.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Class</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClass} className="bg-rose-600 hover:bg-rose-700">
                            Delete Class
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel All Series Classes Confirmation */}
            <AlertDialog open={!!cancellingSeriesClasses} onOpenChange={(open) => !open && setCancellingSeriesClasses(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel All Classes in Series</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel all future classes in this series?
                            <span className="block mt-2 text-amber-600 font-medium">
                                All registered students will be notified. Classes can be reactivated individually.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Classes</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSeriesClasses} className="bg-amber-600 hover:bg-amber-700">
                            Cancel All Classes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Series Classes Confirmation */}
            <AlertDialog open={!!deletingSeriesClasses} onOpenChange={(open) => !open && setDeletingSeriesClasses(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Classes in Series</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete all future classes in this series?
                            <span className="block mt-2 text-rose-600 font-medium">
                                This action cannot be undone. All enrollment data will be lost.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Classes</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSeriesClasses} className="bg-rose-600 hover:bg-rose-700">
                            Delete All Classes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
