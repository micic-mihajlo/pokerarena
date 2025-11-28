import { Variants } from "motion/react";

// Card deal animation - spring from deck position with rotation
export const cardDealVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    rotateZ: -15,
    y: -80,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: custom * 0.1,
    },
  }),
};

// Card flip animation for reveal moments
export const cardFlipVariants: Variants = {
  faceDown: {
    rotateY: 180,
    transition: { duration: 0.4 },
  },
  faceUp: {
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Chip slide animation from player position toward center
export const chipSlideVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    y: -20,
    transition: { duration: 0.3 },
  },
};

// Action badge pop animation
export const actionBadgeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
    y: 15,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: { duration: 0.2 },
  },
};

// Community card reveal with staggered flip
export const communityCardVariants: Variants = {
  hidden: {
    opacity: 0,
    rotateY: 180,
    scale: 0.8,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      type: "spring",
      stiffness: 200,
    },
  }),
};

// Winner pulse celebration
export const winnerVariants: Variants = {
  initial: { scale: 1 },
  winner: {
    scale: [1, 1.03, 1],
    transition: {
      duration: 0.6,
      repeat: 2,
      ease: "easeInOut",
    },
  },
};

// Pot collect animation
export const potCollectVariants: Variants = {
  visible: { opacity: 1, scale: 1, x: 0, y: 0 },
  collect: (targetPosition: { x: number; y: number }) => ({
    opacity: 0,
    scale: 0.5,
    x: targetPosition.x,
    y: targetPosition.y,
    transition: {
      duration: 0.6,
      ease: "easeIn",
    },
  }),
};

// Thinking indicator - bouncing dots
export const thinkingDotVariants: Variants = {
  animate: (i: number = 0) => ({
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      delay: i * 0.12,
      ease: "easeInOut",
    },
  }),
};

// Table entrance animation
export const tableEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Player seat entrance with stagger
export const playerSeatVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      type: "spring",
      stiffness: 200,
    },
  }),
};

// Pot display scale animation
export const potDisplayVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  update: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
    },
  },
};

// Action log entry slide in
export const actionLogEntryVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    height: 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Phase badge transition
export const phaseBadgeVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

// Glow pulse for active elements
export const glowPulseVariants: Variants = {
  idle: {
    boxShadow: "0 0 0 rgba(251, 191, 36, 0)",
  },
  active: {
    boxShadow: [
      "0 0 15px rgba(251, 191, 36, 0.3)",
      "0 0 25px rgba(251, 191, 36, 0.5)",
      "0 0 15px rgba(251, 191, 36, 0.3)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Winner overlay animation
export const winnerOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const winnerCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};
