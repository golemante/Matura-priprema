import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Github, CheckCircle2 } from "lucide-react";
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
        <p className="text-warm-500 text-base">
          Imaš pitanje, prijedlog ili si pronašao grešku u ispitu? Javi nam se.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="space-y-3"
        >
          {[
            {
              icon: Mail,
              label: "Email",
              value: "kontakt@maturapro.hr",
              href: "mailto:kontakt@maturapro.hr",
              color: "primary",
            },
            {
              icon: Github,
              label: "GitHub",
              value: "github.com/maturapro",
              href: "https://github.com",
              color: "warm",
            },
            {
              icon: MessageSquare,
              label: "Prijava greške",
              value: "GitHub Issues",
              href: "https://github.com",
              color: "amber",
            },
          ].map(({ icon: Icon, label, value, href, color }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3.5 p-4 bg-white border border-warm-200 rounded-2xl",
                "hover:border-warm-300 hover:shadow-card-md transition-all duration-200 group",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  color === "primary" && "bg-primary-50",
                  color === "warm" && "bg-warm-100",
                  color === "amber" && "bg-amber-50",
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    color === "primary" && "text-primary-600",
                    color === "warm" && "text-warm-600",
                    color === "amber" && "text-amber-600",
                  )}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm font-semibold text-warm-800 group-hover:text-primary-600 transition-colors">
                  {value}
                </p>
              </div>
            </a>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8 bg-green-50 border border-green-200 rounded-2xl text-center">
              <CheckCircle2 size={32} className="text-green-500" />
              <p className="font-bold text-green-900">Poruka je poslana!</p>
              <p className="text-sm text-green-700">
                Odgovorit ćemo u roku od 48 sati.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", message: "" });
                }}
                className="text-xs font-bold text-green-700 hover:text-green-900 underline underline-offset-2 mt-1"
              >
                Pošalji novu poruku
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-warm-200 rounded-2xl p-5 shadow-card space-y-4"
            >
              <h3 className="text-sm font-bold text-warm-800">
                Pošalji poruku
              </h3>

              {[
                {
                  name: "name",
                  label: "Ime",
                  type: "text",
                  placeholder: "Tvoje ime",
                },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  placeholder: "ime@email.com",
                },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name} className="space-y-1">
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
                    className="w-full px-3.5 py-2.5 text-sm border border-warm-300 rounded-xl bg-white text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-warm-600">
                  Poruka
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Opiši problem ili prijedlog..."
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm border border-warm-300 rounded-xl bg-white text-warm-900 placeholder:text-warm-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Pošalji
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
