import React from 'react';
import { motion } from 'motion/react';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
  className = '',
  align = 'left',
}) {
  const { staggerContainer, staggerItem, viewport } = useMotionPresets();
  const alignClass =
    align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <motion.div
      className={`flex flex-col gap-2 ${alignClass} ${className}`}
      variants={staggerContainer(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {eyebrow && (
        <motion.span
          variants={staggerItem(12)}
          className="text-xs uppercase tracking-[0.2em] text-gold font-medium block"
        >
          {eyebrow}
        </motion.span>
      )}
      {title && (
        <motion.h2
          variants={staggerItem(14)}
          className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight"
        >
          {title}
        </motion.h2>
      )}
      {description && (
        <motion.p
          variants={staggerItem(10)}
          className={`text-sm text-muted max-w-md leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {description}
        </motion.p>
      )}
      {children && (
        <motion.div variants={staggerItem(8)} className="w-full">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
