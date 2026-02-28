// features/auth/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/api/authApi";
import { cn } from "@/utils/utils";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { forgotPasswordSchema } from "@/utils/validators";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  async function onSubmit({ email }) {
    setIsPending(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmittedEmail(email);
      setSent(true);
    } catch {
      // Namjerno ne prikazujemo grešku ako email ne postoji (sigurnost)
      setSubmittedEmail(email);
      setSent(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-7">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4"
              >
                <ArrowLeft size={14} />
                Natrag na prijavu
              </Link>
              <h1 className="text-2xl font-bold text-warm-900 tracking-tight mb-1.5">
                Zaboravljena lozinka
              </h1>
              <p className="text-sm text-warm-500">
                Upiši email adresu i poslat ćemo ti link za resetiranje lozinke.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-warm-700">
                  Email adresa
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    placeholder="ime@email.com"
                    autoComplete="email"
                    className={cn(
                      "w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-white",
                      "text-warm-900 placeholder:text-warm-400",
                      "transition-all duration-150 outline-none",
                      errors.email
                        ? "border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-100"
                        : "border-warm-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
                    )}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-error-500" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isPending}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white",
                  "bg-primary-600 hover:bg-primary-700 transition-all duration-150",
                  "focus-visible:ring-2 focus-visible:ring-primary-200 outline-none",
                  "disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]",
                  "shadow-[0_1px_3px_0_rgb(45_84_232/0.3)]",
                )}
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Slanje...
                  </>
                ) : (
                  "Pošalji reset link"
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-success-50 border border-success-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={26} className="text-success-600" />
            </div>
            <h2 className="text-xl font-bold text-warm-900 mb-2">
              Email je poslan!
            </h2>
            <p className="text-sm text-warm-500 mb-6 leading-relaxed">
              Provjerite inbox za{" "}
              <span className="font-medium text-warm-700">
                {submittedEmail}
              </span>
              .
              <br />
              Link je valjan 60 minuta.
            </p>
            <p className="text-xs text-warm-400">
              Nisi dobio/la email?{" "}
              <button
                onClick={() => setSent(false)}
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Pokušaj opet
              </button>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mt-6"
            >
              <ArrowLeft size={14} />
              Natrag na prijavu
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
