import React from 'react';
import { motion } from 'motion/react';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
};

export function RevealOnScroll({
  children,
  className = '',
  as = 'div',
  delay = 0,
  y = 24,
}) {
  const { reduced, viewport, transition, duration } = useMotionPresets();
  const Component = motionTags[as] || motion.div;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ ...transition(duration.section), delay: reduced ? 0 : delay }}
    >
      {children}
    </Component>
  );
}
