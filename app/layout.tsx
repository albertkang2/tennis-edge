import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { ThemeToggle } from "./components/theme-toggle";
import "./globals.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Tennis Edge Explorer",
  description: "Minimal Tennis Edge Explorer app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
          <header className="border-b border-black/10 dark:border-white/10">
            <div className="flex w-full items-center justify-between gap-4 px-4 py-4">
              <h1 className="text-lg font-semibold">Tennis Edge Explorer</h1>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 w-full px-4 py-8">{children}</main>

          <footer className="border-t border-black/10 dark:border-white/10">
            <div className="w-full px-4 py-6 text-sm text-foreground/70">
              © {year} Tennis Edge Explorer
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
