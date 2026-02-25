// api/authApi.js
// Auth operacije — sada koriste Supabase direktno umjesto custom Node.js backenda
import { supabase } from "@/lib/supabase";

export const authApi = {
  /**
   * Prijava emailom i lozinkom
   * @param {{ email: string, password: string }} credentials
   */
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw { message: error.message };

    // Dohvati profil (ime) iz profiles tablice
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", data.user.id)
      .single();

    return {
      user: { ...data.user, name: profile?.name ?? data.user.email },
      token: data.session.access_token,
    };
  },

  /**
   * Registracija novog korisnika
   * @param {{ name: string, email: string, password: string }} data
   */
  register: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // ovo se sprema u raw_user_meta_data → trigger kreira profile
      },
    });
    if (error) throw { message: error.message };

    return {
      user: { ...data.user, name },
      token: data.session?.access_token ?? null,
    };
  },

  /**
   * Dohvati trenutnu sesiju (za inicijalizaciju pri pokretanju app)
   */
  me: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) throw { message: "Nema aktivne sesije" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", session.user.id)
      .single();

    return {
      user: { ...session.user, name: profile?.name ?? session.user.email },
    };
  },

  /**
   * Odjava
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw { message: error.message };
  },

  /**
   * Zaboravljena lozinka — šalje reset email
   * @param {{ email: string }} data
   */
  forgotPassword: async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw { message: error.message };
  },

  /**
   * Postavljanje nove lozinke (nakon klika na reset link)
   * @param {{ password: string }} data
   */
  resetPassword: async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw { message: error.message };
  },
};
