'use client';

import { motion, useScroll } from 'framer-motion';
import { useRef } from 'react';
import RecorderSection from '@/components/sections/RecorderSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import RecentlyRecognizedSection from '@/components/sections/RecentlyRecognizedSection';
import CanvasBackground from '@/components/effects/CanvasBackground';

export default function Home() {
  const { scrollY } = useScroll();
  const heroRef = useRef(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 130,
        damping: 15
      }
    }
  };

  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">
      <CanvasBackground particleDensity={80} />

      <div className="flex-grow flex flex-col items-center pt-24 pb-20 px-4 sm:px-6 md:px-8 relative z-10">
        <motion.section 
          ref={heroRef}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-6xl mx-auto text-center mb-24 space-y-8"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-block py-2.5 px-5 rounded-full bg-gradient-to-r from-primary-500/20 to-secondary-500/20 backdrop-blur-xl text-primary-200 text-sm font-medium mb-4 border border-white/10 hover:scale-105 transition-all duration-300 shadow-[inset_0_2px_12px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              🎵 FINGERPRINTING-POWERED MUSIC RECOGNITION
            </span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-6xl xl:text-7xl font-bold leading-tight tracking-tighter"
          >
            <span className="text-gradient bg-gradient-to-r from-primary-400 via-white to-secondary-400">
              Instant Music Discovery
            </span>
            <br className="hidden md:block" />
            <span className="text-gradient bg-gradient-to-r from-primary-300 to-secondary-300">
              At Your Fingertips
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light"
          >
            Identify any song in milliseconds using our advanced audio fingerprinting technology. 
            <span className="text-gradient bg-gradient-to-r from-primary-300 to-secondary-300 font-medium">
              {" "}Just hum, whistle, or play it!
            </span>
          </motion.p>
          
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 shadow-xl shadow-primary-500/30 transition-all duration-300 group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative z-10 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Start Listening Now
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-2xl font-medium transition-all duration-300 border border-white/20 hover:border-primary-300/40 bg-white/5 hover:bg-white/10 backdrop-blur-xl hover:shadow-[0_0_32px_rgba(161,161,161,0.1)]"
            >
              <span className="text-gradient bg-gradient-to-r from-primary-300 to-secondary-300">
                How It Works →
              </span>
            </motion.button>
          </motion.div>
        </motion.section>

        {/* Recorder Section - Fixed visibility */}
        <div className="w-full max-w-4xl mx-auto">
          <RecorderSection />
        </div>

        {/* Modernized Sections */}
        <RecentlyRecognizedSection />
        <FeaturesSection />
        <HowItWorksSection />
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: scrollY.get() > 100 ? 0 : 1 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
      >
        <motion.div 
          className="flex flex-col items-center gap-3"
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div className="w-8 h-12 rounded-2xl border-2 border-white/30 p-1 backdrop-blur-lg bg-white/5">
            <motion.div 
              className="w-full h-2 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
              animate={{ y: [0, 18, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </div>
          <span className="text-sm text-white/80 font-light tracking-wide animate-pulse-slow">
            Explore Melofy ↓
          </span>
        </motion.div>
      </motion.div>
    </main>
  );
}