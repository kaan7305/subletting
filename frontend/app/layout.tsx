import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/MobileNav';
import { WebSocketProvider } from '@/lib/websocket-context';
import { ToastProvider } from '@/lib/toast-context';
import { ThemeProvider } from '@/lib/theme-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NestQuarter - Global Student Housing Platform',
  description:
    'Find your perfect student home. Sublet, rent, and connect with verified housing worldwide.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider>
          <WebSocketProvider>
            <ToastProvider>
              <Navbar />
              {children}
              <MobileNav />
            </ToastProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
