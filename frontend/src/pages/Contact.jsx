import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Github,
  CheckCircle2,
  Send,
  ArrowRight,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/utils/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

const CONTACTS = [
  {
    icon: Mail,
    label: "Email",
    value: "kontakt@maturapro.hr",
    sub: "Odgovaramo u roku 48h",
    href: "mailto:kontakt@maturapro.hr",
    color: "primary",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/maturapro",
    sub: "Izvorni kod projekta",
    href: "https://github.com",
    color: "warm",
  },
  {
    icon: MessageSquare,
    label: "Prijava greške",
    value: "GitHub Issues",
    sub: "Za tehničke probleme",
    href: "https://github.com",
    color: "amber",
  },
];

const COLOR_MAP = {
  primary: {
    icon: "text-primary-600",
    bg: "bg-primary-50",
    border: "hover:border-primary-200",
    arrow: "text-primary-400",
  },
  warm: {
    icon: "text-warm-600",
    bg: "bg-warm-100",
    border: "hover:border-warm-400",
    arrow: "text-warm-400",
  },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    border: "hover:border-amber-200",
    arrow: "text-amber-400",
  },
};

const FORM_FIELDS = [
  { name: "name", label: "Ime", type: "text", placeholder: "Tvoje ime" },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "ime@email.com",
  },
];

export function ContactPage() {
  usePageTitle("Kontakt");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  const inputCls =
    "w-full px-3.5 py-2.5 text-sm border border-warm-300 rounded-xl bg-white text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all";

  return (
    <PageWrapper className="max-w-2xl mx-auto">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight mb-2">
          Kontakt
        </h1>
        <p className="text-warm-500 text-base leading-relaxed">
          Pitanje, prijedlog ili si pronašao grešku u ispitu? Javi nam se —
          čitamo svaku poruku.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8"
      >
        {CONTACTS.map(({ icon: Icon, label, value, sub, href, color }) => {
          const c = COLOR_MAP[color];
          return (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={cn(
                "flex items-center sm:flex-col sm:items-start gap-3.5 sm:gap-3",
                "p-4 bg-white border border-warm-200 rounded-2xl",
                "hover:shadow-card-md transition-all duration-200 group",
                c.border,
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  c.bg,
                )}
              >
                <Icon size={17} className={c.icon} />
              </div>
              <div className="flex-1 sm:flex-none min-w-0">
                <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-0.5">
                  {label}
                </p>
                <p className="text-sm font-bold text-warm-900 group-hover:text-primary-700 transition-colors truncate">
                  {value}
                </p>
                <p className="text-xs text-warm-400 hidden sm:block mt-0.5">
                  {sub}
                </p>
              </div>
              <ArrowRight
                size={14}
                className={cn(
                  "flex-shrink-0 sm:hidden transition-transform group-hover:translate-x-0.5",
                  c.arrow,
                )}
              />
            </a>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center gap-4 py-12 px-8 bg-green-50 border border-green-200 rounded-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-lg mb-1">
                Poruka poslana!
              </p>
              <p className="text-sm text-green-700 leading-relaxed">
                Odgovorit ćemo na{" "}
                <span className="font-semibold">{form.email}</span> u roku od 48
                sati.
              </p>
            </div>
            <button
              onClick={() => {
                setSent(false);
                setForm({ name: "", email: "", message: "" });
              }}
              className="text-xs font-bold text-green-700 hover:text-green-900 underline underline-offset-2 transition-colors"
            >
              Pošalji novu poruku
            </button>
          </motion.div>
        ) : (
          <div className="bg-white border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-card">
            <h3 className="text-base font-bold text-warm-900 mb-5 flex items-center gap-2">
              <MessageSquare size={16} className="text-warm-400" />
              Pošalji poruku
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORM_FIELDS.map(({ name, label, type, placeholder }) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-xs font-semibold text-warm-600">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      required
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-600">
                  Poruka
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Opiši problem, prijedlog ili pitanje..."
                  required
                  rows={4}
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              <button
                type="submit"
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2.5 bg-primary-600 hover:bg-primary-700 text-white",
                  "text-sm font-semibold rounded-xl transition-colors shadow-sm",
                  "active:scale-[0.98]",
                )}
              >
                <Send size={14} />
                Pošalji poruku
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
