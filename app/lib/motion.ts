/**
 * @fileOverview Centralized Framer Motion animation variants.
 * This file exports reusable motion props based on the MOTION_DESIGN.md guidelines,
 * ensuring a consistent animation language across the application.
 *
 * import { fadeInUp, stagger } from '@/lib/motion';
 *
 * <motion.div variants={stagger} initial="hidden" animate="visible">
 *   <motion.div variants={fadeInUp}>...</motion.div>
 * </motion.div>
 */

import type { Variants } from 'framer-motion';

// --------------------------------------------------------------------------
// EASING AND DURATION TOKENS
// --------------------------------------------------------------------------
// These values are directly from MOTION_DESIGN.md

export const DURATION_FAST = 0.2;
export const DURATION_MEDIUM = 0.3;
export const DURATION_SLOW = 0.5;

export const EASING_STANDARD = [0.4, 0, 0.2, 1];
export const EASING_BOUNCY = { type: 'spring', stiffness: 500, damping: 30 };


// --------------------------------------------------------------------------
// PRE-BUILT VARIANTS
// --------------------------------------------------------------------------

/**
 * **fadeInUp**
 * A standard variant for revealing content by fading and sliding it up into view.
 * Ideal for page loads, tab switches, and new content reveals.
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_MEDIUM,
      ease: EASING_STANDARD,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATION_FAST,
      ease: EASING_STANDARD,
    },
  },
};


/**
 * **stagger**
 * A container variant to orchestrate staggered animations for its children.
 * Use this on the parent `motion` component.
 */
export const stagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};


/**
 * **pulse**
 * A variant for creating a subtle "breathing" effect.
 * Ideal for persistent state indicators that need to be noticeable but not distracting.
 */
export const pulse = {
    scale: [1, 1.05, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      ease: EASING_STANDARD,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
};


// --------------------------------------------------------------------------
// PRE-BUILT MOTION PROPS
// --------------------------------------------------------------------------

/**
 * **buttonTap**
 * Reusable motion props for immediate, tactile feedback on user taps.
 * Apply these directly to a `motion` component wrapping a button or interactive element.
 *
 * `<motion.div {...buttonTap}>...</motion.div>`
 */
export const buttonTap = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.98 },
};
