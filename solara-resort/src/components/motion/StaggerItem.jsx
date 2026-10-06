import React from 'react';
import { motion } from 'motion/react';
import { staggerDelay } from '../../motion/presets.js';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export function StaggerItem({ children, index = 0, className = '' }) {
  const { reduced, viewport, transition, duration } = useMotionPresets();

  return (
    <motion.div
      className={`h-full w-full min-w-0 ${className}`.trim()}
      initial={{ opacity: 0, y: reduced ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{
        ...transition(duration.card),
        delay: reduced ? 0 : staggerDelay(index),
      }}
    >
      {children}
    </motion.div>
  );
}
