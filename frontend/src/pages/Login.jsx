// pages/Login.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/utils/validators";
import { useLogin } from "@/hooks/useAuth";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

export function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Prijava</h1>
        <p className="text-warm-500 text-sm mb-6">
          Nemaš račun?{" "}
          <Link to="/register" className="text-primary-600 font-medium">
            Registriraj se
          </Link>
        </p>
        <form onSubmit={handleSubmit(login)} className="space-y-4">
          <Input
            label="Email"
            leftIcon={Mail}
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Lozinka"
            leftIcon={Lock}
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full mt-2" loading={isPending}>
            Prijavi se
          </Button>
        </form>
      </div>
    </div>
  );
}
