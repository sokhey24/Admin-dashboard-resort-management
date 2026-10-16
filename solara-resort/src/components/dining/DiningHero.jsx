import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { easeLuxury, motionDuration } from '../../motion/presets.js';
import { Button } from '../ui/Button.jsx';

export function DiningHero({ image, eyebrow, title, onBookTable, onViewMenu, bookLabel, menuLabel }) {
  const reduced = useReducedMotion();

  return (
    <section className="relative w-full min-h-[520px] lg:min-h-[620px] flex flex-col justify-end overflow-hidden pt-20">
      <div className="absolute inset-0 z-0 bg-slate-950">
        {image && (
          <motion.img
            src={image}
            alt=""
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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/25" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16 lg:pb-20">
        <div className="max-w-2xl text-left">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-light mb-4">{eyebrow}</p>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold font-serif text-white tracking-tight leading-[1.12] text-balance mb-6">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" onClick={onBookTable}>
              {bookLabel}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="border-white/45 text-white hover:border-gold hover:text-gold hover:bg-white/5"
              onClick={onViewMenu}
            >
              {menuLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
