"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 pb-24">
        <div className="container mx-auto px-4">
          <div className={`max-w-3xl mx-auto text-center space-y-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 mb-4 animate-fade-in">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Free for all K-State students, staff & faculty</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Free Yoga Classes at Kansas State
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-in-delay-200">
              Find your balance, build strength, and connect with your campus community through yoga
            </p>
            <div className="flex justify-center animate-fade-in-delay-400">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Link href="/schedule">View Class Schedule</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="pb-16 md:pb-24 relative -mt-8">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Participate?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the benefits of yoga in a welcoming, inclusive environment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className={`border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold">Free Classes</h3>
                </div>
                <p className="text-muted-foreground">
                  Accessible to K-State students, staff, and faculty at no cost.
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '100ms' }}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold">All Levels Welcome</h3>
                </div>
                <p className="text-muted-foreground">
                  Whether you're a beginner or experienced, there's a class for you.
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold">Mind & Body</h3>
                </div>
                <p className="text-muted-foreground">
                  Find balance, build strength, improve flexibility, reduce stress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
