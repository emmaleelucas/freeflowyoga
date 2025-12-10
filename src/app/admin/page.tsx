import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { Suspense } from 'react';
import { AdminDashboard } from './admin-dashboard';

async function AdminContent() {
    const adminStatus = await isAdmin();

    if (!adminStatus) {
        redirect('/');
    }

    return <AdminDashboard />;
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    </div>
                    <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <AdminContent />
        </Suspense>
    );
}
