// pages/Register.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/utils/validators";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/authApi";
import { toast } from "@/store/toastStore";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";

export function RegisterPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { mutate: register, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success(`Dobrodošao, ${user.name}! Račun je kreiran.`);
      navigate("/");
    },
    onError: (err) => toast.error(err.message ?? "Greška pri registraciji"),
  });

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="min-h-dvh bg-warm-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-warm-300 shadow-card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Registracija</h1>
        <p className="text-warm-500 text-sm mb-6">
          Već imaš račun?{" "}
          <Link to="/login" className="text-primary-600 font-medium">
            Prijavi se
          </Link>
        </p>
        <form onSubmit={handleSubmit(register)} className="space-y-4">
          <Input
            label="Ime i prezime"
            leftIcon={User}
            type="text"
            error={errors.name?.message}
            {...formRegister("name")}
          />
          <Input
            label="Email"
            leftIcon={Mail}
            type="email"
            error={errors.email?.message}
            {...formRegister("email")}
          />
          <Input
            label="Lozinka"
            leftIcon={Lock}
            type="password"
            error={errors.password?.message}
            {...formRegister("password")}
          />
          <Input
            label="Ponovi lozinku"
            leftIcon={Lock}
            type="password"
            error={errors.confirmPassword?.message}
            {...formRegister("confirmPassword")}
          />
          <Button type="submit" className="w-full mt-2" loading={isPending}>
            Registriraj se
          </Button>
        </form>
      </div>
    </div>
  );
}
