import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Animation Library",
  description: "Production-ready interactions, section animations and shaders for marketing websites.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans">
        <TooltipProvider>
          <SidebarProvider style={{ "--sidebar-width": "17rem" } as React.CSSProperties}>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 items-center px-4 md:hidden">
                <SidebarTrigger />
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
