import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { easeLuxury, motionDuration } from '../../motion/presets.js';

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

function heroItem(reduced) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.2 : 0.55, ease: easeLuxury },
    },
  };
}

export const HeroSection = ({
  image,
  title,
  subtitle,
  badge,
  children,
  heightClass = 'min-h-[580px] lg:min-h-[640px]',
}) => {
  const reduced = useReducedMotion();

  return (
    <section
      className={`relative w-full ${heightClass} flex flex-col justify-center items-center overflow-hidden pt-20 pb-16`}
    >
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
        {image && (
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1 }}
            animate={reduced ? { scale: 1 } : { scale: 1.04 }}
            transition={{
              duration: motionDuration.ambient,
              ease: 'linear',
              repeat: reduced ? 0 : Infinity,
              repeatType: 'mirror',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-slate-950/75 to-slate-950/40" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
        variants={reduced ? undefined : heroStagger}
        initial={reduced ? { opacity: 0 } : 'hidden'}
        animate={reduced ? { opacity: 1 } : 'visible'}
        transition={reduced ? { duration: 0.2 } : undefined}
      >
        {badge && (
          <motion.div
            variants={heroItem(reduced)}
            className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-light bg-gold/20 backdrop-blur-md px-3.5 py-1 rounded-full border border-gold/40"
          >
            <span>{badge}</span>
          </motion.div>
        )}

        <motion.h1
          variants={heroItem(reduced)}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white tracking-tight leading-[1.15] max-w-4xl text-balance drop-shadow-sm mb-4"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            variants={heroItem(reduced)}
            className="text-base sm:text-lg md:text-xl text-slate-200/90 max-w-2xl text-balance leading-relaxed mb-8 font-light"
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div variants={heroItem(reduced)} className="w-full max-w-6xl mt-2">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};
