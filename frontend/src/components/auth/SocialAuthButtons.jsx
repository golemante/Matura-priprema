// features/auth/components/SocialAuthButtons.jsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/store/toastStore";
import { cn } from "@/utils/utils";

// Google SVG icon (brand color)
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Apple SVG icon
function AppleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function SocialAuthButtons({ mode = "login" }) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const label = mode === "login" ? "Prijavi se" : "Registriraj se";

  async function handleGoogle() {
    setLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message ?? "Greška s Google prijavom");
      setLoadingGoogle(false);
    }
  }

  async function handleApple() {
    setLoadingApple(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message ?? "Greška s Apple prijavom");
      setLoadingApple(false);
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loadingGoogle || loadingApple}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-4 py-2.5",
          "rounded-xl border border-warm-300 bg-white text-sm font-medium text-warm-800",
          "hover:bg-warm-50 hover:border-warm-400 transition-all duration-150",
          "focus-visible:ring-2 focus-visible:ring-primary-200 outline-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]",
        )}
      >
        {loadingGoogle ? (
          <span className="w-[18px] h-[18px] rounded-full border-2 border-warm-300 border-t-warm-600 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>{label} s Googleom</span>
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={handleApple}
        disabled={loadingApple || loadingGoogle}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-4 py-2.5",
          "rounded-xl bg-warm-900 text-sm font-medium text-white",
          "hover:bg-warm-800 transition-all duration-150",
          "focus-visible:ring-2 focus-visible:ring-warm-400 outline-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.08)]",
        )}
      >
        {loadingApple ? (
          <span className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <AppleIcon />
        )}
        <span>{label} s Appleom</span>
      </button>
    </div>
  );
}
