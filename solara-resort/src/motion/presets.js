/** Luxury easing — soft deceleration, no overshoot */
export const easeLuxury = [0.22, 1, 0.36, 1];

export const motionDuration = {
  micro: 0.18,
  button: 0.22,
  card: 0.4,
  section: 0.55,
  page: 0.26,
  modalExit: 0.16,
  ambient: 20,
};

export const defaultViewport = {
  once: true,
  margin: '-80px',
};

/** @param {boolean} reduced */
export function luxuryTransition(reduced, duration = motionDuration.card) {
  return {
    duration: reduced ? Math.min(duration, 0.2) : duration,
    ease: easeLuxury,
  };
}

/** @param {boolean} reduced */
export function fadeUpMotion(reduced, y = 20) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : -8 },
  };
}

/** @param {boolean} reduced */
export function fadeMotion(reduced) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
}

/** @param {boolean} reduced */
export function fadeLeftMotion(reduced, x = 16) {
  return {
    initial: { opacity: 0, x: reduced ? 0 : x },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reduced ? 0 : x * 0.5 },
  };
}

/** @param {boolean} reduced */
export function scaleInMotion(reduced) {
  return {
    initial: { opacity: 0, scale: reduced ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reduced ? 1 : 0.98 },
  };
}

/** @param {boolean} reduced */
export function pageTransitionMotion(reduced) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : -6 },
  };
}

/** @param {boolean} reduced */
export function modalPanelMotion(reduced) {
  return {
    initial: { opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: reduced ? 1 : 0.98, y: reduced ? 0 : 4 },
  };
}

/** @param {boolean} reduced */
export function staggerContainerVariants(reduced, stagger = 0.08) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : 0.04,
      },
    },
  };
}

/** @param {boolean} reduced */
export function staggerItemVariants(reduced, y = 18) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: luxuryTransition(reduced, motionDuration.card),
    },
  };
}

/** Cap stagger delay for large lists (ms-like factor in seconds) */
export function staggerDelay(index, cap = 6, step = 0.06) {
  return Math.min(index, cap) * step;
}
