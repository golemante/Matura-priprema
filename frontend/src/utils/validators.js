// utils/validators.js
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Unesite ispravnu email adresu"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 znakova"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Ime mora imati najmanje 2 znaka"),
    email: z.string().email("Unesite ispravnu email adresu"),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 znakova"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export const isValidExamId = (id) =>
  /^[a-z]+-\d{4}-[a-z]+-[a-z]+$/.test(id ?? "");
