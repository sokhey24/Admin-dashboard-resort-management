import React from 'react';
import { motion } from 'motion/react';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export function FadeIn({ children, className = '', delay = 0, y = 12 }) {
  const { reduced, fadeUp, transition, duration } = useMotionPresets();

  return (
    <motion.div
      className={className}
      {...fadeUp(y)}
      transition={{ ...transition(duration.card), delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
