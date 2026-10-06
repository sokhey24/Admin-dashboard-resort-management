import { useReducedMotion } from 'motion/react';
import {
  defaultViewport,
  fadeLeftMotion,
  fadeMotion,
  fadeUpMotion,
  luxuryTransition,
  modalPanelMotion,
  motionDuration,
  pageTransitionMotion,
  scaleInMotion,
  staggerContainerVariants,
  staggerItemVariants,
} from './presets.js';

export function useMotionPresets() {
  const reduced = useReducedMotion();

  return {
    reduced: Boolean(reduced),
    viewport: defaultViewport,
    duration: motionDuration,
    transition: (duration = motionDuration.card) => luxuryTransition(reduced, duration),
    fadeUp: (y) => fadeUpMotion(reduced, y),
    fade: () => fadeMotion(reduced),
    fadeLeft: (x) => fadeLeftMotion(reduced, x),
    scaleIn: () => scaleInMotion(reduced),
    page: () => pageTransitionMotion(reduced),
    modalPanel: () => modalPanelMotion(reduced),
    staggerContainer: (stagger) => staggerContainerVariants(reduced, stagger),
    staggerItem: (y) => staggerItemVariants(reduced, y),
  };
}
