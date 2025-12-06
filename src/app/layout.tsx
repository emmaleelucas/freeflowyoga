import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />

            <nav className="sticky top-0 z-50 w-full flex justify-center border-b border-[#644874]/20 dark:border-[#644874]/30 h-16 bg-background/80 backdrop-blur-md shadow-sm">
              <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center">
                  <Link href={"/"} className="flex items-center gap-2 font-semibold group">
                    <div className="relative">
                      <Image src="/images/logo.png" alt="K-State Free Yoga Logo" width={32} height={32} className="dark:hidden transition-transform group-hover:scale-110" />
                      <Image src="/images/logo-dark.png" alt="K-State Free Yoga Logo" width={32} height={32} className="hidden dark:block transition-transform group-hover:scale-110" />
                    </div>
                    <span className="hidden min-[500px]:inline bg-gradient-to-r from-[#644874] to-[#6B92B5] bg-clip-text text-transparent">
                      K-State Free Yoga
                    </span>
                  </Link>
                  <Link
                    href={"/schedule"}
                    className="relative px-3 py-2 rounded-md font-medium transition-all duration-200 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:text-[#644874] dark:hover:text-[#9d7fb0]"
                  >
                    Schedule
                  </Link>
                  <Link
                    href={"/explore"}
                    className="relative px-3 py-2 rounded-md font-medium transition-all duration-200 hover:bg-[#644874]/10 dark:hover:bg-[#644874]/20 hover:text-[#644874] dark:hover:text-[#9d7fb0]"
                  >
                    Explore
                  </Link>
                </div>
                {!hasEnvVars ? (
                  <EnvVarWarning />
                ) : (
                  <Suspense>
                    <AuthButton />
                  </Suspense>
                )}
              </div>
            </nav>

            {children}

            <footer className="w-full flex items-center justify-center border-t border-[#644874]/20 dark:border-[#644874]/30 mx-auto text-center text-xs gap-8 py-16 bg-gradient-to-b from-background to-[#644874]/5 dark:to-[#644874]/10">
              <p className="text-muted-foreground">
                Powered by{" "}
                <a
                  href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                  target="_blank"
                  className="font-bold hover:text-[#644874] dark:hover:text-[#9d7fb0] transition-colors"
                  rel="noreferrer"
                >
                  Supabase
                </a>
              </p>
              <ThemeSwitcher />
            </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
