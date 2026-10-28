import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EYE_TRAVEL = 3.2;
const HEAD_TILT_MAX = 14;

/**
 * Lightweight 3D-style Solara AI mascot (CSS). Eyes and head subtly track the pointer.
 */
export const SolaraBotMascot = ({ className = '', active = false }) => {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const [eye, setEye] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onPointerMove = useCallback(
    (e) => {
      const el = rootRef.current;
      if (!el || reduced) return;
      const rect = el.getBoundingClientRect();
      const headCx = rect.left + rect.width * 0.5;
      const headCy = rect.top + rect.height * 0.28;
      const dx = e.clientX - headCx;
      const dy = e.clientY - headCy;
      const len = Math.hypot(dx, dy) || 1;
      const norm = Math.min(1, len / 120);
      setEye({
        x: (dx / len) * EYE_TRAVEL * norm,
        y: (dy / len) * EYE_TRAVEL * norm,
      });
      setTilt({
        x: Math.max(-HEAD_TILT_MAX, Math.min(HEAD_TILT_MAX, (dx / rect.width) * 28)),
        y: Math.max(-8, Math.min(8, (-dy / rect.height) * 16)),
      });
    },
    [reduced],
  );

  useEffect(() => {
    if (reduced) return undefined;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [onPointerMove, reduced]);

  return (
    <div
      ref={rootRef}
      className={`relative select-none [perspective:280px] ${className}`}
      aria-hidden
    >
      <div
        className="relative mx-auto h-[52px] w-[44px] sm:h-[56px] sm:w-[48px]"
        style={{
          transform: reduced ? undefined : `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.12s ease-out',
        }}
      >
        <motion.div
          className="relative h-full w-full"
          animate={
            reduced
              ? undefined
              : {
                  y: active ? [0, -2, 0] : [0, -4, 0],
                  rotateZ: active ? 0 : [0, 1.5, 0, -1.5, 0],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: active ? 2.2 : 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        >
        {/* Head */}
        <div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(12px)' }}
        >
          <div
            className="relative h-[22px] w-[30px] sm:h-[24px] sm:w-[32px] rounded-[45%] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 shadow-[0_4px_10px_rgba(15,23,42,0.35),inset_0_2px_4px_rgba(255,255,255,0.9)]"
          >
            <div className="absolute -left-1 top-[6px] h-[6px] w-[5px] rounded-full bg-gradient-to-r from-slate-200 to-slate-400 opacity-90" />
            <div className="absolute -right-1 top-[6px] h-[6px] w-[5px] rounded-full bg-gradient-to-l from-slate-200 to-slate-400 opacity-90" />
            <div
              className="absolute left-1/2 top-[7px] h-[10px] w-[22px] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-900 to-black shadow-inner"
            >
              <div className="absolute inset-0 flex items-center justify-center gap-[5px] pt-[1px]">
                <span
                  className="h-[5px] w-[6px] rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee,0_0_14px_#06b6d4]"
                  style={{
                    transform: `translate(${eye.x}px, ${eye.y}px)`,
                    transition: 'transform 0.08s ease-out',
                  }}
                />
                <span
                  className="h-[5px] w-[6px] rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee,0_0_14px_#06b6d4]"
                  style={{
                    transform: `translate(${eye.x}px, ${eye.y}px)`,
                    transition: 'transform 0.08s ease-out',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Torso */}
        <div
          className="absolute left-1/2 top-[18px] z-10 -translate-x-1/2 sm:top-[20px]"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(6px)' }}
        >
          <div
            className="relative h-[26px] w-[28px] sm:h-[28px] sm:w-[30px] rounded-[42%] bg-gradient-to-b from-white via-slate-100 to-slate-300 shadow-[0_6px_14px_rgba(15,23,42,0.28),inset_0_-3px_6px_rgba(148,163,184,0.35)]"
          >
            <div className="absolute bottom-[7px] left-[4px] right-[4px] h-[2px] rounded-full bg-cyan-400/90 shadow-[0_0_10px_#22d3ee]" />
          </div>
        </div>

        {/* Arms */}
        <div
          className="absolute left-0 top-[22px] z-[5] h-[18px] w-[8px] rounded-full bg-gradient-to-b from-slate-100 to-slate-400 shadow-md"
          style={{ transform: 'rotate(18deg) translateZ(4px)' }}
        >
          <div className="absolute left-1/2 top-[7px] h-[2px] w-[6px] -translate-x-1/2 rounded-full bg-cyan-400/80" />
        </div>
        <div
          className="absolute right-0 top-[22px] z-[5] h-[18px] w-[8px] rounded-full bg-gradient-to-b from-slate-100 to-slate-400 shadow-md"
          style={{ transform: 'rotate(-18deg) translateZ(4px)' }}
        >
          <div className="absolute left-1/2 top-[7px] h-[2px] w-[6px] -translate-x-1/2 rounded-full bg-cyan-400/80" />
        </div>

        {/* Soft glow under bot */}
        <div
          className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-md"
          style={{ transform: 'translateZ(-8px)' }}
        />
        </motion.div>
      </div>
    </div>
  );
};
