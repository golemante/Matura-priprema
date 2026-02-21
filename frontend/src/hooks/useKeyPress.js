// hooks/useKeyPress.js
import { useEffect } from "react";

export function useKeyPress(keyMap) {
  useEffect(() => {
    const handler = (e) => {
      // Ne okidaj u input/textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        action(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyMap]);
}

// Primjer korištenja u ExamTaking:
// useKeyPress({
//   ArrowRight: () => goTo(currentIndex + 1),
//   ArrowLeft: () => goTo(currentIndex - 1),
//   a: () => handleAnswer("a"),
//   b: () => handleAnswer("b"),
//   c: () => handleAnswer("c"),
//   d: () => handleAnswer("d"),
// });
