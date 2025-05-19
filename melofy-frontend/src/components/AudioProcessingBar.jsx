'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AudioProcessingBar() {
  const [levels, setLevels] = useState(Array(20).fill(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setLevels(prev => prev.map(() => Math.random() * 80 + 20));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {levels.map((level, i) => (
        <motion.div
          key={i}
          animate={{ height: `${level}%` }}
          transition={{ duration: 0.2 }}
          className="w-2 bg-primary rounded-full"
          style={{ height: '20%' }}
        />
      ))}
    </div>
  );
}