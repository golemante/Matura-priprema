// pages/Login.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/utils/validators";
import { useLogin } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";

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
        <p className="text-xs text-error-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-error-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function LoginPage() {
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  return (
    <AuthLayout mode="login">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-warm-900 tracking-tight mb-1.5">
          Dobro došao natrag
        </h1>
        <p className="text-sm text-warm-500">
          Nemaš račun?{" "}
          <Link
            to="/register"
            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            Registriraj se besplatno →
          </Link>
        </p>
      </div>

      {/* Social auth (Hick's Law: samo 2 opcije) */}
      <SocialAuthButtons mode="login" />

      <AuthDivider />

      {/* Email/password form */}
      <form onSubmit={handleSubmit(login)} className="space-y-4" noValidate>
        <FormInput
          label="Email adresa"
          type="email"
          placeholder="ime@email.com"
          leftIcon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          {...register("email")}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Lozinka"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link
              to="/zaboravljena-lozinka"
              className="text-xs text-warm-500 hover:text-primary-600 transition-colors"
            >
              Zaboravio/la lozinku?
            </Link>
          </div>
        </div>

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
              <span>Prijavljivanje...</span>
            </>
          ) : (
            "Prijavi se"
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <p className="text-xs text-warm-400 text-center mt-6 leading-relaxed">
        Prijavom prihvaćaš{" "}
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
