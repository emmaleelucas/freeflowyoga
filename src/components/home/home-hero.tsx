"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function HomeHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Set up Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-16 pb-24">
      <div className="container mx-auto px-4">
        <div className={`max-w-3xl mx-auto text-center space-y-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#644874]/10 dark:bg-[#644874]/20 border border-[#644874]/30 dark:border-[#644874]/40 mb-4 animate-fade-in">
            <Sparkles className="h-4 w-4 text-[#644874] dark:text-[#9d7fb0] animate-pulse" />
            <span className="text-sm font-medium text-[#644874] dark:text-[#9d7fb0]">Free for all K-State students, staff & faculty</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-r from-[#644874] via-[#6B92B5] to-[#644874] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Free Yoga Classes at Kansas State
          </h1>
          <div className="flex justify-center animate-fade-in-delay-400">
            <Button asChild size="lg" className="bg-gradient-to-r from-[#644874] to-[#6B92B5] hover:from-[#553965] hover:to-[#5A7FA0] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Link href="/schedule">View Class Schedule</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
