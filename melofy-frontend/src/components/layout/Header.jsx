'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RiMenu3Line, RiCloseLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  // You can modify these credentials or move them to environment variables
  const ADMIN_CREDENTIALS = {
    id: 'admin',
    password: 'admin123'
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    if (credentials.id === ADMIN_CREDENTIALS.id && credentials.password === ADMIN_CREDENTIALS.password) {
      // Store authentication state (you might want to use a more secure method)
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthModalOpen(false);
      setCredentials({ id: '', password: '' });
      router.push('/manager');
    } else {
      setAuthError('Invalid credentials. Please try again.');
    }
  };

  const handleManageClick = (e) => {
    e.preventDefault();
    
    // Check if already authenticated
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      router.push('/manager');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setCredentials({ id: '', password: '' });
    setAuthError('');
    setShowPassword(false);
  };

  return (
    <>
      <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-950/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
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

            <nav className="hidden md:flex items-center gap-8">
              <NavLink href="/" text="Home" />
              <NavLink href="/history" text="History" />
              <NavLink href="/about" text="About" />
              <AuthProtectedNavLink onClick={handleManageClick} text="Manage" />
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
                  <MobileAuthProtectedNavLink onClick={handleManageClick} text="Manage" />
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

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeAuthModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg flex items-center justify-center">
                  <RiLockLine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Admin Access</h2>
                  <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin ID
                  </label>
                  <input
                    type="text"
                    value={credentials.id}
                    onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter admin ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <RiEyeOffLine className="w-5 h-5" />
                      ) : (
                        <RiEyeLine className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    {authError}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all"
                  >
                    Access Manager
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

const AuthProtectedNavLink = ({ onClick, text }) => (
  <motion.div whileHover={{ scale: 1.05 }} className="relative">
    <button
      onClick={onClick}
      className="px-3 py-2 text-gray-300 hover:text-white font-medium transition-colors relative group flex items-center gap-2"
    >
      {text}
      <RiLockLine className="w-4 h-4" />
      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
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

const MobileAuthProtectedNavLink = ({ onClick, text }) => (
  <motion.div whileTap={{ scale: 0.95 }}>
    <button
      onClick={onClick}
      className="w-full text-left py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
    >
      {text}
      <RiLockLine className="w-4 h-4" />
    </button>
  </motion.div>
);