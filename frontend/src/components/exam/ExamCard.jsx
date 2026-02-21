// components/exam/ExamCard.jsx
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/utils/utils";

export function ExamCard({ exam, subject, onClick }) {
  return (
    <Card hover onClick={onClick} className="group p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={cn("text-xs", subject.color.badge)}>
              {exam.session.name}
            </Badge>
            <Badge
              variant="outline"
              className={
                exam.difficulty.id === "visa"
                  ? "text-amber-700 border-amber-200 bg-amber-50"
                  : ""
              }
            >
              {exam.difficulty.short}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-warm-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {exam.year}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {exam.duration} min
            </span>
            <span className="font-medium">{exam.questionCount} pitanja</span>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-warm-300 group-hover:text-warm-600 transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0 ml-2"
        />
      </div>
    </Card>
  );
}
