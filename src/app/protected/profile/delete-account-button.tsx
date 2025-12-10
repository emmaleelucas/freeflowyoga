
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteAccount();
    setIsDeleting(false);

    if (result.success) {
      toast.success("Your account has been deleted");
      // Redirect to home page
      router.push("/");
    } else if (result.error) {
      toast.error(result.error);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setDialogOpen(true)}
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete my account
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This will permanently remove:
            </AlertDialogDescription>
            <div className="space-y-2 pt-2">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your profile information</li>
                <li>All class registrations</li>
                <li>Your attendance history</li>
              </ul>
              <div className="font-semibold text-destructive pt-2 text-sm">
                This action is irreversible and cannot be undone.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
