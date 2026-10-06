import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export function PageTransition({ children }) {
  const location = useLocation();
  const { page, transition, duration } = useMotionPresets();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        {...page()}
        transition={transition(duration.page)}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
