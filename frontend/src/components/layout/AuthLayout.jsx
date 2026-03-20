import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Award, Zap, Shield, Clock } from "lucide-react";

const stats = [
  { icon: BookOpen, value: "132+", label: "ispita" },
  { icon: TrendingUp, value: "8", label: "predmeta" },
  { icon: Award, value: "15k+", label: "pitanja" },
  { icon: Zap, value: "100%", label: "besplatno" },
];

const features = [
  "Pravi ispiti od 2010. do danas",
  "Automatsko bodovanje i pregled grešaka",
  "Personalizirana statistika napretka",
  "Radi na svim uređajima",
];

const TRUST_BADGES = [
  { icon: Shield, label: "Sigurno" },
  { icon: Clock, label: "Uvijek dostupno" },
  { icon: Zap, label: "Besplatno" },
];

export function AuthLayout({ children, mode = "login" }) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col relative overflow-hidden bg-warm-900 flex-shrink-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-800/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          <div className="flex items-center gap-2.5 mb-auto">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Matura<span className="text-primary-400">Pro</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="my-12"
          >
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Pripremi se za
              <br />
              <span className="text-primary-400">maturu</span> s
              <br />
              pravim ispitima.
            </h1>
            <p className="text-warm-400 text-base leading-relaxed max-w-xs">
              Vježbaj na stvarnim ispitima, prati napredak i dođi spreman na
              najvažniji dan.
            </p>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3 mb-10"
          >
            {features.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.25 + i * 0.07,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-3 text-sm text-warm-300"
              >
                <div className="w-4 h-4 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                </div>
                {f}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-4 gap-3 pt-8 border-t border-warm-700"
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon size={14} className="text-primary-400 mx-auto mb-1" />
                <div className="text-white font-bold text-lg leading-none">
                  {value}
                </div>
                <div className="text-warm-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white min-h-dvh lg:min-h-0">
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-warm-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-warm-900 tracking-tight">
              Matura<span className="text-primary-600">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="hidden xs:flex items-center gap-1 text-[10px] text-warm-500 font-medium"
              >
                <Icon size={11} className="text-warm-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-center gap-6 py-3 px-5 bg-warm-50 border-b border-warm-200">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={12} className="text-primary-500 flex-shrink-0" />
              <span className="text-xs font-bold text-warm-800">{value}</span>
              <span className="text-xs text-warm-400 hidden xs:inline">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center p-5 sm:p-8 py-8 sm:py-10">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px]"
          >
            {children}
          </motion.div>
        </div>

        <div className="lg:hidden h-6" />
      </div>
    </div>
  );
}
