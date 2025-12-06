import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Calendar } from "lucide-react";
import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#644874]/5 via-white to-[#6B92B5]/5 dark:from-[#644874]/15 dark:via-background dark:to-[#6B92B5]/10">
      <Card className="w-full max-w-md border-2 border-[#644874]/20 dark:border-[#644874]/30">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#6B92B5]/15 dark:bg-[#6B92B5]/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-[#6B92B5] dark:text-[#9dbdd6]" />
          </div>
          <div>
            <CardTitle className="text-2xl">Account Deleted</CardTitle>
            <CardDescription className="text-base mt-2">
              Your account has been permanently deleted
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              All your data, including your profile, class registrations, and attendance history has been removed from our system.
            </p>
            <p>
              Thank you for being part of K-State Free Yoga. We hope to see you again in the future!
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-[#644874] hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965]">
                <Home className="h-4 w-4 mr-2" />
                Go to Home Page
              </Button>
            </Link>
            <Link href="/schedule" className="block">
              <Button variant="outline" className="w-full border-[#644874]/30 hover:bg-[#644874]/10 dark:border-[#644874]/40 dark:hover:bg-[#644874]/20">
                <Calendar className="h-4 w-4 mr-2" />
                View Class Schedule
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
