import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { createBrowserClient } from "@supabase/ssr";

interface AuthFormProps {
  type: "login" | "register";
}

export default function AuthForm({ type }: AuthFormProps) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState<string[]>(Array(8).fill(""));
  const [countdown, setCountdown] = useState(0);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message, type } }));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    if (type === "register" && !username.trim()) {
      showToast("Please enter a username.", "error");
      return;
    }
    if (countdown > 0) {
      showToast(`Please wait ${countdown}s before requesting another OTP.`, "error");
      return;
    }

    setLoading(true);

    try {
      // Clear any pre-existing local session token
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: type === "register" ? { username: username.trim() } : undefined,
        },
      });

      if (error) {
        if (error.status === 429) {
          showToast("Too many requests. Please wait before trying again.", "error");
          setCountdown(60);
          return;
        } else {
          throw error;
        }
      } else {
        setStep("otp");
        setCountdown(60);
        showToast("Magic link and OTP sent! Check your email.", "success");
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (error: any) {
      showToast(error.message || "An error occurred during authentication.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    // Handle paste
    if (value.length > 1) {
      const pastedData = value.slice(0, 8).split('');
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 8) newOtp[index + i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(index + pastedData.length, 7);
      otpRefs.current[nextFocus]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto focus next
      if (value && index < 7) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && otp.every(v => v !== "")) {
      handleVerifyOTP();
    }
  };

  const handleVerifyOTP = async () => {
    const token = otp.join("");
    if (token.length !== 8) {
      showToast("Please enter a valid 8-digit OTP.", "error");
      return;
    }

    setLoading(true);

    try {
      const typesToTry: ("signup" | "email" | "magiclink")[] = type === "register" 
        ? ["signup", "email", "magiclink"] 
        : ["email", "magiclink", "signup"];

      let sessionData = null;
      let lastError = null;

      for (const otpType of typesToTry) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: otpType,
        });

        if (!error && data?.session) {
          sessionData = data.session;
          lastError = null;
          break;
        }
        lastError = error;
      }

      if (lastError || !sessionData) {
        setOtp(Array(8).fill(""));
        otpRefs.current[0]?.focus();
        throw new Error(lastError?.message || "Invalid OTP code");
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session: sessionData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to finalize authentication");
      }

      showToast("Successfully authenticated!", "success");
      // Redirect to overview
      window.location.href = "/";
    } catch (error: any) {
      showToast(error.message || "Invalid OTP code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden text-slate-200">
      <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-emerald-500/10 blur-3xl rounded-full w-32 h-32 pointer-events-none" />
      
      <div className="text-center space-y-2 mb-8 flex flex-col items-center">
        <img src="/logo.png" alt="Monty Logo" className="h-10 mx-auto drop-shadow-md mb-2" />
        <p className="text-sm text-slate-400">
          {step === "email" 
            ? (type === "register" ? "Enter your username and email to register" : "Enter your email to sign in via Magic Link or OTP") 
            : "Enter the 8-digit code sent to your email"}
        </p>
      </div>

      <div className={`transition-all duration-500 ${step === "email" ? "opacity-100" : "opacity-0 hidden"}`}>
        <form onSubmit={handleSendOTP} className="space-y-5 relative z-10">
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Choose a username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 px-4 rounded-xl border-slate-800 bg-slate-900 focus-visible:ring-emerald-500 text-white placeholder:text-slate-600"
                required
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 rounded-xl border-slate-800 bg-slate-900 focus-visible:ring-emerald-500 text-white placeholder:text-slate-600"
              required
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || countdown > 0}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-[#10b981] hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] border-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : countdown > 0 ? (
              `Resend available in ${countdown}s`
            ) : (
              "Send Magic Link & OTP"
            )}
          </Button>

          <div className="text-center mt-4">
            {type === "login" ? (
              <p className="text-xs text-slate-400">
                Belum punya akun?{" "}
                <a href="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold underline">
                  Daftar di sini
                </a>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Sudah punya akun?{" "}
                <a href="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold underline">
                  Masuk di sini
                </a>
              </p>
            )}
          </div>
        </form>
      </div>

      <div className={`transition-all duration-500 ${step === "otp" ? "opacity-100" : "opacity-0 hidden"}`}>
        <div className="space-y-6 relative z-10">
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={digit}
                ref={(el) => (otpRefs.current[idx] = el)}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                disabled={loading}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-slate-800 bg-slate-900 focus-visible:ring-emerald-500 text-white p-0"
              />
            ))}
          </div>

          <Button 
            onClick={handleVerifyOTP}
            disabled={loading || otp.some(v => v === "")}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-[#10b981] hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] border-none"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center space-y-2 mt-4">
            <p className="text-xs text-slate-400">Atau klik link langsung di email kamu</p>
            <Button 
              variant="link" 
              onClick={() => handleSendOTP()} 
              disabled={countdown > 0 || loading}
              className="text-xs text-emerald-500 hover:text-emerald-400"
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </Button>
            <div className="mt-2">
              <Button 
                variant="link" 
                onClick={() => setStep("email")} 
                className="text-xs text-slate-500 hover:text-slate-400"
              >
                Change Email Address
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
