import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/layout/Navigation";
import { AuthSyncProvider } from "@/components/auth/AuthSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ЕГЭ Тренажёр — Русский язык",
  description:
    "Ежедневная практика заданий ЕГЭ по русскому языку. Тренируйся, копи XP, поддерживай streak!",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ЕГЭ Тренажёр — Русский язык",
    description:
      "Ежедневная практика заданий ЕГЭ по русскому языку. Тренируйся, копи XP, поддерживай streak!",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <AuthSyncProvider>
              <Navigation />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
            </AuthSyncProvider>
            <footer className="hidden md:block border-t border-border py-4 text-center text-sm text-muted-foreground bg-card">
              ЕГЭ Тренажёр — Русский язык &copy; {new Date().getFullYear()}
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
