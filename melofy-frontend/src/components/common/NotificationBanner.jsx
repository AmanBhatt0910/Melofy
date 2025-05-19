'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from 'react-icons/ri';

export default function NotificationBanner({ message, type = 'info' }) {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-500/15 text-green-500 border-green-500/30',
    error: 'bg-red-500/15 text-red-500 border-red-500/30',
    info: 'bg-primary/15 text-primary border-primary/30',
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30'
  };

  const icons = {
    success: <RiCheckboxCircleLine className="w-5 h-5" />,
    error: <RiErrorWarningLine className="w-5 h-5" />,
    info: <RiInformationLine className="w-5 h-5" />,
    warning: <RiErrorWarningLine className="w-5 h-5" />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 rounded-lg px-4 py-3 shadow-lg border ${typeStyles[type]} flex items-center max-w-md w-11/12`}
    >
      <span className="mr-2">
        {icons[type]}
      </span>
      <p className="text-sm font-medium flex-1">
        {message}
      </p>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsVisible(false)}
        className="hover:opacity-70 transition-opacity ml-3"
      >
        <RiCloseLine className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}