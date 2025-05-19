// Footer.jsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { RiGithubFill, RiTwitterFill, RiInstagramFill, RiLinkedinFill } from 'react-icons/ri';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950/95 backdrop-blur-xl border-t border-white/10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎵</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                Melofy
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Revolutionizing music recognition with AI-powered audio fingerprinting technology.
            </p>
            <div className="flex gap-4">
              <SocialIcon href="#" icon={<RiTwitterFill className="w-5 h-5" />} />
              <SocialIcon href="#" icon={<RiInstagramFill className="w-5 h-5" />} />
              <SocialIcon href="#" icon={<RiGithubFill className="w-5 h-5" />} />
              <SocialIcon href="#" icon={<RiLinkedinFill className="w-5 h-5" />} />
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              <FooterLink href="/about" text="About Us" />
              <FooterLink href="/careers" text="Careers" />
              <FooterLink href="/blog" text="Blog" />
              <FooterLink href="/contact" text="Contact" />
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Resources</h3>
            <ul className="space-y-3">
              <FooterLink href="/help" text="Help Center" />
              <FooterLink href="/privacy" text="Privacy Policy" />
              <FooterLink href="/terms" text="Terms of Service" />
              <FooterLink href="/faq" text="FAQ" />
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-br from-purple-500 to-blue-600 text-white py-3 rounded-lg shadow-lg shadow-purple-500/20"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <span className="text-gray-400 text-sm">
            © {currentYear} Melofy. All rights reserved.
          </span>
          <div className="flex gap-4">
            <FooterLink href="/privacy" text="Privacy Policy" />
            <FooterLink href="/terms" text="Terms of Service" />
          </div>
        </div>
      </div>
    </footer>
  );
}

const FooterLink = ({ href, text }) => (
  <motion.li whileHover={{ x: 5 }}>
    <Link
      href={href}
      className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
    >
      <span className="h-px w-4 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      {text}
    </Link>
  </motion.li>
);

const SocialIcon = ({ href, icon }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -2 }}
    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all"
  >
    {icon}
  </motion.a>
);