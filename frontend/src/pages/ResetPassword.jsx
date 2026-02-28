// features/auth/pages/ResetPasswordPage.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useState } from "react";
import { authApi } from "@/api/authApi";
import { toast } from "@/store/toastStore";
import { cn } from "@/utils/utils";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: "onTouched" });

  async function onSubmit({ password }) {
    setIsPending(true);
    try {
      await authApi.resetPassword({ password });
      toast.success("Lozinka je uspješno promijenjena!");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.message ?? "Greška pri postavljanju lozinke");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-warm-900 tracking-tight mb-1.5">
          Nova lozinka
        </h1>
        <p className="text-sm text-warm-500">Upiši svoju novu lozinku.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <PasswordInput
          label="Nova lozinka"
          placeholder="Min. 8 znakova"
          error={errors.password?.message}
          autoComplete="new-password"
          {...register("password")}
        />
        <PasswordInput
          label="Ponovi novu lozinku"
          placeholder="Ponovi lozinku"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />

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
              Postavljanje...
            </>
          ) : (
            "Postavi novu lozinku"
          )}
        </motion.button>
      </form>
    </AuthLayout>
  );
}
