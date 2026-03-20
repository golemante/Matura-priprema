import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function InViewSection({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  margin = "-60px",
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
