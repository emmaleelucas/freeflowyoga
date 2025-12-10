"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, HelpCircle, Mail } from "lucide-react";
import { DeleteAccountButton } from "./delete-account-button";

export function ProfileSettingsDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Profile Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account preferences and support options.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Support Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Support
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Need help with your account or class registration?
                            </p>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <a href="mailto:recservices@k-state.edu">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Contact Rec Services
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-3 pt-4 border-t">
                        <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                        <div className="bg-destructive/5 rounded-lg p-4">
                            <DeleteAccountButton />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
