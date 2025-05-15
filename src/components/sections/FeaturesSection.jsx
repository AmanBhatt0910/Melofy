'use client';

import { motion } from 'framer-motion';
import { RiMusic2Fill, RiHistoryFill, RiDatabase2Fill, RiBrushFill } from 'react-icons/ri';

export default function FeaturesSection() {
  const features = [
    {
      icon: <RiMusic2Fill className="w-8 h-8 text-[rgb(var(--color-primary-500))]" />,
      title: "Accurate Recognition",
      description: "Powered by advanced audio fingerprinting technology to identify songs with high precision even in noisy environments."
    },
    {
      icon: <RiHistoryFill className="w-8 h-8 text-[rgb(var(--color-primary-500))]" />,
      title: "History & Saved Songs",
      description: "Keep track of all your identified songs and save your favorites for easy access later."
    },
    {
      icon: <RiDatabase2Fill className="w-8 h-8 text-[rgb(var(--color-primary-500))]" />,
      title: "Extensive Database",
      description: "Access millions of songs across various genres, languages, and periods for comprehensive coverage."
    },
    {
      icon: <RiBrushFill className="w-8 h-8 text-[rgb(var(--color-primary-500))]" />,
      title: "Beautiful Interface",
      description: "Enjoy a sleek, intuitive interface designed for the best user experience with minimal learning curve."
    }
  ];

  return (
    <section className="w-full max-w-6xl mx-auto my-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Why Choose Melofy?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Revolutionizing music recognition with cutting-edge technology
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="card glass-effect hover:border-primary-500/30 transition-all"
          >
            <div className="flex flex-col items-start p-6">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}