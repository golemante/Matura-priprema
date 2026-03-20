import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/utils/validators";
import { useLogin } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/common/Input";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { Spinner } from "@/components/common/LoadingSpinner";

export function LoginPage() {
  const location = useLocation();
  const from = location.state?.from;
  const redirectTo = from?.pathname ?? "/";
  const { mutate: login, isPending } = useLogin();
  usePageTitle(PAGE_TITLES.login);

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
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-[26px] font-bold text-warm-900 tracking-tight mb-1.5">
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

      <SocialAuthButtons mode="login" />

      <AuthDivider />

      <form
        onSubmit={handleSubmit((values) => login({ ...values, redirectTo }))}
        className="space-y-4"
        noValidate
      >
        <Input
          label="Email adresa"
          type="email"
          placeholder="ime@email.com"
          leftIcon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          inputMode="email"
          {...register("email")}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Lozinka"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register("password")}
          />
          <div className="flex justify-end pt-0.5">
            <Link
              to="/zaboravljena-lozinka"
              className="text-xs text-warm-500 hover:text-primary-600 transition-colors py-1"
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
            "w-full py-3 px-4 rounded-xl text-sm font-semibold text-white",
            "bg-primary-600 hover:bg-primary-700 active:bg-primary-800",
            "transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-200 outline-none",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "shadow-[0_1px_3px_0_rgb(45_84_232/0.3)]",
            "flex items-center justify-center gap-2 min-h-[48px]",
          )}
        >
          {isPending ? (
            <>
              <Spinner size="sm" variant="white" />
              <span>Prijavljivanje...</span>
            </>
          ) : (
            "Prijavi se"
          )}
        </motion.button>
      </form>

      <p className="text-xs text-warm-400 text-center mt-6 leading-relaxed">
        Prijavom prihvaćaš{" "}
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
