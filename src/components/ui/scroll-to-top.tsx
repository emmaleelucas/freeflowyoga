"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility)

        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
            <Button
                onClick={scrollToTop}
                size="icon"
                className="rounded-full h-12 w-12 bg-[#644874] hover:bg-[#553965] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
                <ArrowUp className="h-6 w-6 text-white" />
                <span className="sr-only">Scroll to top</span>
            </Button>
        </div>
    )
}
