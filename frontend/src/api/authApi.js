import { supabase } from "@/lib/supabase";

function extractName(user) {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0]?.trim() ??
    "Korisnik"
  );
}

export const authApi = {
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw { message: error.message };

    return {
      user: { ...data.user, name: extractName(data.user) },
      token: data.session.access_token,
    };
  },

  register: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw { message: error.message };

    return {
      user: { ...data.user, name },
      token: data.session?.access_token ?? null,
      requiresConfirmation: !data.session,
    };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw { message: error.message };
  },

  forgotPassword: async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw { message: error.message };
  },

  resetPassword: async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw { message: error.message };
  },
};
