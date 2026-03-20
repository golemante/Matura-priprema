import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/utils/cn";

const DAYS = ["Po", "Ut", "Sr", "Čet", "Pet", "Sub", "Ned"];

function activityIntensity(count, maxCount) {
  if (count === 0) return "bg-white/10";
  const ratio = count / maxCount;
  if (ratio >= 0.75) return "bg-white";
  if (ratio >= 0.4) return "bg-white/60";
  return "bg-white/35";
}

export function HeroBanner({ user, streak, weekActivity, avgPct }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobra večer";

  const maxCount = Math.max(...weekActivity, 1);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5 text-white">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-primary-200 text-sm font-medium">{greeting},</p>
          <h1 className="text-xl font-bold mt-0.5">
            {user?.name ?? "Korisnik"} 👋
          </h1>
          {avgPct > 0 && (
            <p className="text-primary-200 text-xs mt-1">
              Prosječni rezultat:{" "}
              <span className="text-white font-bold">{avgPct}%</span>
            </p>
          )}
        </div>

        {streak > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 border border-white/20 backdrop-blur-sm px-3 py-2 rounded-xl"
          >
            <Flame size={15} className="text-orange-300" />
            <div className="text-right">
              <p className="text-sm font-black leading-none">{streak}</p>
              <p className="text-[10px] text-primary-200 leading-none mt-0.5">
                dan streak
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative mt-4 flex items-end gap-1.5">
        {weekActivity.map((count, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors",
                activityIntensity(count, maxCount),
                count > 0 ? "text-primary-700" : "text-primary-300",
              )}
            >
              {count > 0 ? count : DAYS[i][0]}
            </div>
            <span className="text-[9px] text-primary-300">{DAYS[i]}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-primary-300 self-end pb-1">
          Ova 7 dana
        </span>
      </div>
    </div>
  );
}
