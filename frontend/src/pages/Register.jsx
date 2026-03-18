import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/utils/validators";
import { useRegister } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/common/Input";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { Spinner } from "@/components/common/LoadingSpinner";

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

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister();
  usePageTitle(PAGE_TITLES.register);

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

      <SocialAuthButtons mode="register" />

      <AuthDivider />

      <form onSubmit={handleSubmit(register)} className="space-y-4" noValidate>
        <Input
          label="Ime i prezime"
          type="text"
          placeholder="Pero Perić"
          leftIcon={User}
          error={errors.name?.message}
          autoComplete="name"
          {...formRegister("name")}
        />

        <Input
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
              <Spinner size="sm" variant="white" />
              <span>Kreiranje računa...</span>
            </>
          ) : (
            "Kreiraj račun"
          )}
        </motion.button>
      </form>

      <p className="text-xs text-warm-400 text-center mt-6 leading-relaxed">
        Registracijom prihvaćaš{" "}
        <Link
          to="/uvjeti"
          className="underline hover:text-warm-600 transition-colors"
        >
          uvjete korištenja
        </Link>{" "}
        i{" "}
        <Link
          to="/privatnost"
          className="underline hover:text-warm-600 transition-colors"
        >
          politiku privatnosti
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
