// lib/supabase.js
// Singleton Supabase klijent — importaj svugdje gdje trebaš bazu ili auth
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Nedostaju VITE_SUPABASE_URL ili VITE_SUPABASE_ANON_KEY u .env.local",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Supabase će sam čuvati sesiju u localStorage — ne treba nam više authStore za token
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // za magic link / OAuth redirect
  },
});
