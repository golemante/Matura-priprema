// pages/Register.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/utils/validators";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/authApi";
import { toast } from "@/store/toastStore";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { cn } from "@/utils/utils";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";

function PasswordStrength({ password = "" }) {
  const checks = [
    { label: "8+ znakova", ok: password.length >= 8 },
    { label: "Veliko slovo", ok: /[A-Z]/.test(password) },
    { label: "Broj", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;

  if (!password) return null;

  const colors = [
    "bg-error-400",
    "bg-warning-500",
    "bg-warning-500",
    "bg-success-500",
  ];
  const labels = ["", "Slaba", "Srednja", "Jaka"];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-2 space-y-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < score ? colors[score] : "bg-warm-200",
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {checks.map(({ label, ok }) => (
              <span
                key={label}
                className={cn(
                  "text-xs transition-colors",
                  ok ? "text-success-600" : "text-warm-400",
                )}
              >
                {ok ? "✓" : "○"} {label}
              </span>
            ))}
          </div>
          {score > 0 && (
            <span
              className={cn(
                "text-xs font-medium",
                score === 3 ? "text-success-600" : "text-warning-600",
              )}
            >
              {labels[score]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FormInput({ label, error, leftIcon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none">
            <Icon size={15} />
          </div>
        )}
        <input
          className={cn(
            "w-full py-2.5 text-sm rounded-xl border bg-white",
            "text-warm-900 placeholder:text-warm-400",
            "transition-all duration-150 outline-none",
            Icon ? "pl-9 pr-4" : "px-4",
            error
              ? "border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-100"
              : "border-warm-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error-600 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-error-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function RegisterPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { mutate: register, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, token }) => {
      if (token) setAuth(user, token);
      toast.success(`Dobrodošao, ${user.name}! Račun je kreiran. 🎉`);
      navigate("/");
    },
    onError: (err) => toast.error(err.message ?? "Greška pri registraciji"),
  });

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const password = watch("password", "");

  return (
    <AuthLayout mode="register">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-warm-900 tracking-tight mb-1.5">
          Kreiraj račun
        </h1>
        <p className="text-sm text-warm-500">
          Već imaš račun?{" "}
          <Link
            to="/login"
            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            Prijavi se →
          </Link>
        </p>
      </div>

      {/* Social auth */}
      <SocialAuthButtons mode="register" />

      <AuthDivider />

      {/* Form */}
      <form onSubmit={handleSubmit(register)} className="space-y-4" noValidate>
        <FormInput
          label="Ime i prezime"
          type="text"
          placeholder="Pero Perić"
          leftIcon={User}
          error={errors.name?.message}
          autoComplete="name"
          {...formRegister("name")}
        />

        <FormInput
          label="Email adresa"
          type="email"
          placeholder="ime@email.com"
          leftIcon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          {...formRegister("email")}
        />

        <div>
          <PasswordInput
            label="Lozinka"
            placeholder="Min. 8 znakova"
            error={errors.password?.message}
            autoComplete="new-password"
            {...formRegister("password")}
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordInput
          label="Ponovi lozinku"
          placeholder="Ponovi lozinku"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...formRegister("confirmPassword")}
        />

        <motion.button
          type="submit"
          disabled={isPending}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white",
            "bg-primary-600 hover:bg-primary-700 active:bg-primary-800",
            "transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-200 outline-none",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "shadow-[0_1px_3px_0_rgb(45_84_232/0.3)]",
            "flex items-center justify-center gap-2 min-h-[44px]",
          )}
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Kreiranje računa...</span>
            </>
          ) : (
            "Kreiraj račun"
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <p className="text-xs text-warm-400 text-center mt-6 leading-relaxed">
        Registracijom prihvaćaš{" "}
        <a href="#" className="underline hover:text-warm-600 transition-colors">
          uvjete korištenja
        </a>{" "}
        i{" "}
        <a href="#" className="underline hover:text-warm-600 transition-colors">
          politiku privatnosti
        </a>
        .
      </p>
    </AuthLayout>
  );
}
