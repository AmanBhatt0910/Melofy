'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    // Only add scroll listener on client side
    handleScroll(); // Set initial state
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-950/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo section with fixed gradient */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-white/5 backdrop-blur-sm" />
            </div>
            <Link href={'/'}>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                Melofy
              </span>
            </Link>
          </motion.div>

          {/* Rest of the component remains the same */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/" text="Home" />
            <NavLink href="/history" text="History" />
            <NavLink href="/about" text="About" />
          </nav>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center gap-2 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
            >
              <span>Get Started</span>
            </motion.button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? (
                <RiCloseLine className="w-6 h-6" />
              ) : (
                <RiMenu3Line className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                <MobileNavLink href="/" text="Home" />
                <MobileNavLink href="/history" text="History" />
                <MobileNavLink href="/about" text="About" />
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full mt-6 bg-gradient-to-br from-purple-500 to-blue-600 text-white py-3 rounded-xl shadow-lg shadow-purple-500/20"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


const NavLink = ({ href, text }) => (
  <motion.div whileHover={{ scale: 1.05 }} className="relative">
    <Link
      href={href}
      className="px-3 py-2 text-gray-300 hover:text-white font-medium transition-colors relative group"
    >
      {text}
      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  </motion.div>
);

const MobileNavLink = ({ href, text }) => (
  <motion.div whileTap={{ scale: 0.95 }}>
    <Link
      href={href}
      className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
    >
      {text}
    </Link>
  </motion.div>
);