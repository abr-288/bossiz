import { motion, Transition, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -4,
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.15,
};

/**
 * PageTransition - Wrapper pour des transitions de page fluides avec Framer Motion
 * Utilise translate3d pour des animations GPU-accélérées
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  const optimizedTransition: Transition = {
    type: "tween",
    ease: [0.4, 0, 0.2, 1],
    duration: prefersReducedMotion ? 0 : 0.15,
  };
  
  const optimizedVariants: Variants = prefersReducedMotion ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
  } : pageVariants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={optimizedVariants}
      transition={optimizedTransition}
      style={{
        willChange: prefersReducedMotion ? "auto" : "opacity, transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
