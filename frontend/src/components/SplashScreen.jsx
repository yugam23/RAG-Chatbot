import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

/**
 * SplashScreen Component
 *
 * Displays a startup animation:
 * 1. Icon appears in center
 * 2. Icon slides left as Text appears
 * 3. Compete unit remains centered
 * 4. Fades out
 */
const SplashScreen = ({ onComplete }) => {
  const [step, setStep] = useState('initial'); // initial -> text -> complete

  useEffect(() => {
    // Sequence timing
    const sequence = async () => {
      // Step 1: Wait for initial icon appearance
      await new Promise((r) => setTimeout(r, 1000));

      // Step 2: Show text
      setStep('text');

      // Step 3: Wait for text to be fully read
      await new Promise((r) => setTimeout(r, 2000));

      // Step 4: Finish
      onComplete();
    };

    sequence();
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 px-4 w-full h-full"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stack vertically on mobile, horizontally on desktop */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full">
        {/* Icon */}
        <motion.img
          src="/chatbot.png"
          alt="Logo"
          className="w-24 h-24 object-contain flex-shrink-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
            type: 'spring',
            stiffness: 100,
          }}
        />

        {/* Text Container */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={step === 'text' ? { width: 'auto', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
            delay: 0.2, // Slight delay after state change
          }}
          className="overflow-hidden whitespace-nowrap flex items-center"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight py-2 leading-tight text-center">
            RAG Chatbot
          </h1>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
