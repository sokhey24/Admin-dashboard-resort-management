import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useMotionPresets } from '../../motion/useMotionPresets.js';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const modalRef = useRef(null);
  const [portalRoot, setPortalRoot] = useState(null);
  const { modalPanel, fade, transition, duration } = useMotionPresets();

  useEffect(() => {
    setPortalRoot(typeof document !== 'undefined' ? document.body : null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  const dialog = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-dialog-title' : undefined}
        >
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            {...fade()}
            transition={transition(duration.button)}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={modalRef}
            className={`relative w-full ${maxWidthStyles[maxWidth] || maxWidthStyles.lg} bg-surface border border-border rounded-[var(--radius-modal)] shadow-2xl p-6 sm:p-8 z-[201] my-auto`}
            {...modalPanel()}
            transition={transition(duration.button)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                {title && (
                  <h3
                    id="modal-dialog-title"
                    className="text-xl font-semibold text-text tracking-tight font-serif"
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-muted mt-2 leading-relaxed">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-text">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!portalRoot) {
    return null;
  }

  return createPortal(dialog, portalRoot);
};
