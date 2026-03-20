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
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Input } from "@/components/common/Input";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import { Spinner } from "@/components/common/LoadingSpinner";

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
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-[26px] font-bold text-warm-900 tracking-tight mb-1.5">
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
          inputMode="email"
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
              <span>Kreiranje računa...</span>
            </>
          ) : (
            "Kreiraj račun"
          )}
        </motion.button>
      </form>

      <p className="text-xs text-warm-400 text-center mt-5 leading-relaxed">
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
