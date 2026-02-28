// utils/validators.js
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email je obavezan")
    .email("Upiši valjanu email adresu"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ime mora imati barem 2 znaka")
      .max(50, "Ime je predugo"),
    email: z
      .string()
      .min(1, "Email je obavezan")
      .email("Upiši valjanu email adresu"),
    password: z
      .string()
      .min(8, "Lozinka mora imati barem 8 znakova")
      .regex(/[A-Z]/, "Dodaj barem jedno veliko slovo")
      .regex(/[0-9]/, "Dodaj barem jedan broj"),
    confirmPassword: z.string().min(1, "Potvrda lozinke je obavezna"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email je obavezan")
    .email("Upiši valjanu email adresu"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Lozinka mora imati barem 8 znakova")
      .regex(/[A-Z]/, "Dodaj barem jedno veliko slovo")
      .regex(/[0-9]/, "Dodaj barem jedan broj"),
    confirmPassword: z.string().min(1, "Potvrdi novu lozinku"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export const isValidExamId = (id) =>
  /^[a-z]+-\d{4}-[a-z]+-[a-z]+$/.test(id ?? "");
