'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorEffect() {
  const [isHovering, setIsHovering] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const scaleSpring = useSpring(1, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleHover = (e) => {
      const target = e.target;
      if (target.closest('a, button, input, .interactive')) {
        scaleSpring.set(2);
        setIsHovering(true);
      } else {
        scaleSpring.set(1);
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleHover);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleHover);
    };
  }, []);

  return (
    <motion.div
      className="fixed w-8 h-8 rounded-full pointer-events-none z-50 mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
        scale: scaleSpring,
        backgroundColor: isHovering ? '#fff' : '#6366f1',
      }}
      animate={{
        opacity: isHovering ? 0.8 : 0.6,
        scale: scaleSpring.get(),
      }}
      transition={{
        scale: { type: 'spring', damping: 15, stiffness: 300 },
        opacity: { duration: 0.2 }
      }}
    >
      <div className="absolute inset-0 rounded-full bg-current blur-md opacity-20" />
    </motion.div>
  );
}