// components/exam/QuestionView.jsx
import { motion } from "framer-motion";
import { Flag, CheckCircle } from "lucide-react";
import { MathText } from "@/components/math/MathRenderer";
import { cn } from "@/utils/utils";

export function QuestionView({
  question,
  selectedAnswer,
  onAnswer,
  onFlag,
  isFlagged,
  index,
}) {
  return (
    <div>
      {/* Question card */}
      <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-5">
          <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full">
            Pitanje {index + 1}
          </span>
          <div className="flex items-center gap-2 text-xs text-warm-400">
            <span>
              {question.points} {question.points === 1 ? "bod" : "boda"}
            </span>
            <button
              onClick={onFlag}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isFlagged
                  ? "text-amber-600 bg-amber-50"
                  : "text-warm-400 hover:text-warm-700 hover:bg-warm-100",
              )}
              title="Označi pitanje (F)"
            >
              <Flag size={16} />
            </button>
          </div>
        </div>
        <MathText
          text={question.text}
          className="text-warm-900 font-medium text-base leading-relaxed"
        />
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const selected = selectedAnswer === opt.id;
          return (
            <motion.button
              key={opt.id}
              onClick={() => onAnswer(opt.id)}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 group",
                selected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all",
                  selected
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-warm-300 text-warm-400 group-hover:border-warm-500",
                )}
              >
                {opt.id.toUpperCase()}
              </div>
              <MathText
                text={opt.text}
                className={cn(
                  "text-sm font-medium flex-1",
                  selected ? "text-primary-800" : "text-warm-700",
                )}
              />
              {selected && (
                <CheckCircle
                  size={16}
                  className="text-primary-500 ml-auto flex-shrink-0"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
