'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ClassList } from './class-list';
import { AddClassDialog } from './add-class-dialog';

export function ClassesManagement() {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleClassAdded = () => {
        setRefreshKey(prev => prev + 1);
        setAddDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Classes</CardTitle>
                    <Button
                        onClick={() => setAddDialogOpen(true)}
                        className="bg-[#644874] hover:bg-[#553965]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Class
                    </Button>
                </CardHeader>
                <CardContent>
                    <ClassList key={refreshKey} onUpdate={() => setRefreshKey(prev => prev + 1)} />
                </CardContent>
            </Card>

            <AddClassDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={handleClassAdded}
            />
        </div>
    );
}
