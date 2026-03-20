import { useState, useEffect } from "react";

export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!target) return;
    let frame;
    const start = performance.now();

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setVal(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return val;
}
