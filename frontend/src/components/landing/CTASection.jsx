import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const TRUST = ["Pravi NCVVO ispiti", "Odmah vidiš rezultate", "Prati napredak"];

export function CTASection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="page-container py-14 md:py-16">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 md:p-12 text-center"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
          >
            <Sparkles size={11} />
            Besplatno za sve učenike
          </motion.div>

          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight text-balance mb-3">
            Spreman za maturu?
          </h2>
          <p className="text-primary-200 text-base max-w-md mx-auto leading-relaxed mb-8">
            Kreni s vježbanjem odmah — bez registracije. Stotine pravih ispita
            čekaju.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/predmeti")}
              className="flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.25)] transition-shadow duration-200"
            >
              Odaberi predmet
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/15 transition-colors duration-200"
            >
              Stvori račun
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8">
            {TRUST.map((text) => (
              <div
                key={text}
                className="flex items-center gap-1.5 text-white/70 text-xs"
              >
                <CheckCircle2 size={12} className="text-white/50" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
