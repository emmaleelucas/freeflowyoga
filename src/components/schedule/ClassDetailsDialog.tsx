"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { YogaClass } from "@/lib/types"
import { MapPin, User, AlignLeft, CalendarClock, CheckCircle2, X } from "lucide-react"
import { registerForClass, unregisterFromClass } from "@/lib/actions"
import { useEffect, useState } from "react"
import Link from "next/link"

interface ClassDetailsDialogProps {
  classes: YogaClass[]
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
  initialRegistrationData?: {
    isRegistered: boolean
    isAuthenticated: boolean
  }
}

export function ClassDetailsDialog({
  classes,
  open,
  onOpenChange,
  initialRegistrationData,
}: ClassDetailsDialogProps) {
  const yogaClass = classes[0]
  const [isRegistered, setIsRegistered] = useState(initialRegistrationData?.isRegistered ?? false)
  const [isAuthenticated, setIsAuthenticated] = useState(initialRegistrationData?.isAuthenticated ?? false)
  const [isLoading, setIsLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if class has already started
  const hasClassStarted = () => {
    if (!yogaClass) return false

    const [year, month, day] = yogaClass.date.split('-').map(Number)
    const [hours, minutes] = yogaClass.startTime.split(':').map(Number)
    const classStartTime = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()

    return now >= classStartTime
  }

  const isClassStarted = hasClassStarted()

  useEffect(() => {
    if (open && initialRegistrationData) {
      // Use initial registration data passed from parent
      setIsRegistered(initialRegistrationData.isRegistered)
      setIsAuthenticated(initialRegistrationData.isAuthenticated)
      setJustRegistered(false)
      setError(null)
    }
  }, [open, initialRegistrationData])

  const handleRegister = async () => {
    if (!yogaClass) return

    setIsLoading(true)
    setError(null)

    const result = await registerForClass(yogaClass.id)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setJustRegistered(true)
      setIsRegistered(true)
    }

    setIsLoading(false)
  }

  const handleUnregister = async () => {
    if (!yogaClass) return

    setIsLoading(true)
    setError(null)

    const result = await unregisterFromClass(yogaClass.id)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setIsRegistered(false)
      setJustRegistered(false)
    }

    setIsLoading(false)
  }

  if (!yogaClass) return null

  const formatDateTime = (dateString: string, startTime: string, endTime: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    const dayNum = date.getDate();

    const formatTimeShort = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'pm' : 'am';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
    };

    return `${weekday}, ${monthName} ${dayNum} • ${formatTimeShort(startTime)} - ${formatTimeShort(endTime)}`;
  };

  const googleMapsUrl = yogaClass.location?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(yogaClass.location.address)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
            {yogaClass.className}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
            {formatDateTime(yogaClass.date, yogaClass.startTime, yogaClass.endTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <User className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0]" />
            <span>{yogaClass.instructorName}</span>
          </div>

          <div className="flex items-start gap-2 text-sm text-foreground">
            <MapPin className="h-4 w-4 mt-0.5 text-[#644874] dark:text-[#9d7fb0]" />
            <div className="flex flex-col">
              <span>
                {yogaClass.location?.building || 'TBA'}, {yogaClass.location?.room || 'TBA'}
              </span>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#644874] hover:text-[#553965] hover:underline text-xs dark:text-[#9d7fb0] dark:hover:text-[#b99cc9]"
                >
                  View on Google Maps
                </a>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-foreground">
            <AlignLeft className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#644874] dark:text-[#9d7fb0]" />
            <p>{yogaClass.classDescription}</p>
          </div>

          <Badge className={yogaClass.matsProvided
            ? "bg-[#644874] text-white hover:bg-[#644874]"
            : "border-[#644874] text-[#644874] bg-transparent hover:bg-transparent hover:border-[#644874] hover:text-[#644874] dark:border-[#9d7fb0] dark:text-[#9d7fb0] dark:hover:bg-transparent dark:hover:border-[#9d7fb0] dark:hover:text-[#9d7fb0]"
          }>
            {yogaClass.matsProvided ? "Mats Provided" : "Bring Your Own Mat"}
          </Badge>

          {yogaClass.isCancelled && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mt-4 dark:bg-rose-900/15 dark:border-rose-800/50">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                This class has been cancelled
              </p>
            </div>
          )}

          {/* Registration Section */}
          {!yogaClass.isCancelled && isAuthenticated && (
            <div className="mt-6 pt-6 border-t">
              {isClassStarted && isRegistered ? (
                // Past class that user attended
                <div className="bg-[#6B92B5]/10 border border-[#6B92B5]/20 rounded-lg p-4 dark:bg-[#6B92B5]/15 dark:border-[#6B92B5]/30">
                  <div className="flex items-center gap-2 text-[#6B92B5] dark:text-[#9dbdd6]">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">You attended this class</p>
                  </div>
                </div>
              ) : justRegistered ? (
                <div className="bg-[#6B92B5]/10 border border-[#6B92B5]/20 rounded-lg p-4 dark:bg-[#6B92B5]/15 dark:border-[#6B92B5]/30">
                  <div className="flex items-center gap-2 text-[#6B92B5] dark:text-[#9dbdd6] mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">Successfully registered!</p>
                  </div>
                  <p className="text-sm text-[#6B92B5] dark:text-[#9dbdd6] mb-4">
                    You're all set for this class. We'll see you there!
                  </p>
                  <div className="space-y-2">
                    <Link href="/protected/profile">
                      <Button className="w-full bg-[#644874] hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965]">
                        View My Schedule
                      </Button>
                    </Link>
                    <Button
                      onClick={handleUnregister}
                      disabled={isLoading}
                      variant="ghost"
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/15"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {isLoading ? "Canceling..." : "Cancel Registration"}
                    </Button>
                  </div>
                </div>
              ) : isRegistered ? (
                <div className="bg-[#644874]/10 border border-[#644874]/20 rounded-lg p-4 dark:bg-[#644874]/15 dark:border-[#644874]/30">
                  <div className="flex items-center gap-2 text-[#644874] dark:text-[#9d7fb0] mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">You're registered for this class</p>
                  </div>
                  <div className="space-y-2">
                    <Link href="/protected/profile">
                      <Button variant="outline" className="w-full">
                        View My Schedule
                      </Button>
                    </Link>
                    <Button
                      onClick={handleUnregister}
                      disabled={isLoading}
                      variant="ghost"
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/15"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {isLoading ? "Canceling..." : "Cancel Registration"}
                    </Button>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <div>
                  {isClassStarted ? (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Sign-ups are closed for this class.
                      </p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 dark:bg-rose-900/15 dark:border-rose-800/50">
                          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                        </div>
                      )}
                      <Button
                        onClick={handleRegister}
                        disabled={isLoading}
                        className="w-full bg-[#644874] hover:bg-[#553965] dark:bg-[#644874] dark:hover:bg-[#553965]"
                      >
                        {isLoading ? "Registering..." : "Sign Up for Class"}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
