'use client';

import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CursorEffect from '@/components/effects/CursorEffect';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800']
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700']
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} scroll-smooth`}>
      <body className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100 antialiased relative overflow-x-hidden">
        <CursorEffect particleSize={2} trailLength={20} />
        
        <div className="fixed inset-0 z-0 opacity-30">
          <div className="absolute w-[80vh] h-[80vh] rounded-full bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-[100px] -top-1/3 -left-1/3 animate-rotate"></div>
          <div className="absolute w-[60vh] h-[60vh] rounded-full bg-gradient-to-br from-secondary-600/30 to-transparent blur-[80px] top-1/3 right-0 animate-rotate-reverse"></div>
        </div>

        <div className="fixed inset-0 z-0 bg-[url('/noise.png')] opacity-5 mix-blend-soft-light pointer-events-none"></div>

        <Header />
        
        <main className="relative z-10 pt-24">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}