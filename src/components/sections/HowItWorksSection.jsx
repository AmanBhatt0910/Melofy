'use client';

import { motion } from 'framer-motion';

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Record Audio",
      description: "Tap the record button to capture a few seconds of the song playing around you."
    },
    {
      number: "02",
      title: "Audio Processing",
      description: "Our system converts the audio into a unique digital fingerprint using Fast Fourier Transform."
    },
    {
      number: "03",
      title: "Database Matching",
      description: "The fingerprint is matched against millions of songs in our database for identification."
    },
    {
      number: "04",
      title: "Get Results",
      description: "View detailed information about the identified song including title, artist, and album."
    }
  ];

  return (
    <section className="w-full max-w-6xl mx-auto my-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Melofy uses advanced audio processing algorithms to identify songs quickly and accurately.
        </p>
      </div>
      
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-secondary-500))] hidden md:block" />
        
        <div className="space-y-12 relative">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 items-center`}
            >
              <div className={`w-full md:w-1/2 text-center ${
                index % 2 === 0 ? 'md:text-right' : 'md:text-left'
              }`}>
                <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] mb-2">
                  {step.number}
                </h3>
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-gray-400">{step.description}</p>
              </div>
              
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-secondary-600))] flex items-center justify-center text-xl font-bold z-10 relative">
                  {parseInt(step.number)}
                </div>
              </div>
              
              <div className="w-full md:w-1/2" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}