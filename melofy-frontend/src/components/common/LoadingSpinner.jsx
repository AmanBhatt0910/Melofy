'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 40 }) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="rounded-full border-t-2 border-l-2 border-primary"
        style={{ height: size, width: size }}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      <motion.div
        className="absolute rounded-full border-r-2 border-b-2 border-indigo-400"
        style={{ height: size * 0.7, width: size * 0.7 }}
        animate={{ rotate: -360 }}
        transition={{ 
          duration: 1.8, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
    </div>
  );
}