'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Welcome to Melofy!",
      content: "Let's learn how to identify songs quickly.",
    },
    {
      title: "Step 1: Record Audio",
      content: "Tap the microphone button to start recording.",
    },
    {
      title: "Step 2: Wait for Analysis",
      content: "Our AI will process the audio in seconds.",
    },
    {
      title: "Step 3: View Results",
      content: "See song details and save your favorites!",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="card max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {steps[step - 1].title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {steps[step - 1].content}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i + 1 === step
                          ? 'bg-primary'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="btn-secondary px-4 py-2"
                    >
                      Back
                    </button>
                  )}
                  {step < steps.length ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="btn-primary px-4 py-2"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="btn-primary px-4 py-2"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}