import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();
  const { reduced, transition, duration } = useMotionPresets();

  const enterX = reduced ? 0 : 30;
  const exitX = reduced ? 0 : 20;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const iconMap = {
            success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
            info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
          };

          const borderMap = {
            success: 'border-emerald-500/30 bg-surface/95 text-text',
            error: 'border-rose-500/30 bg-surface/95 text-text',
            warning: 'border-amber-500/30 bg-surface/95 text-text',
            info: 'border-sky-500/30 bg-surface/95 text-text',
          };

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={transition(duration.button)}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-[var(--radius-button)] border shadow-xl backdrop-blur-md ${borderMap[toast.type] || borderMap.info}`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {iconMap[toast.type] || iconMap.info}
                <span className="text-xs font-medium truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted hover:text-text p-1 transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
