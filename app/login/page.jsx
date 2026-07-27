"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const mobileInputRef = useRef(null);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    mobileInputRef.current?.focus();
  }, []);

  const isValidMobile = (num) => /^01[3-9]\d{8}$/.test(num);
  const isValidPassword = (pwd) => pwd.length >= 6;
  const isFormValid = isValidMobile(mobile) && isValidPassword(password);

  const handleMobileChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    setMobile(value);
  };

  const handlePasswordKeyDown = (e) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("দয়া করে সঠিক তথ্য প্রবেশ করুন");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // ✅ cache avoid
        body: JSON.stringify({ mobile, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "লগইন ব্যর্থ হয়েছে");
        setPassword("");
        return;
      }

      const redirectPath = data.mustChangePassword
        ? "/force-change-password"
        : "/dashboard";

      router.push(redirectPath);
      router.refresh(); // ✅ layout + navbar instantly update হবে

    } catch (err) {
      setError("সার্ভার সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏦</div>
            <h1 className="text-3xl font-bold text-white">
              LoanTrack Login
            </h1>
            <p className="text-white/60 text-sm mt-2">
              আপনার একাউন্টে প্রবেশ করুন
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-5">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Mobile */}
            <div>
              <label className="block text-xs text-white/60 mb-2">
                মোবাইল নম্বর
              </label>
              <input
                ref={mobileInputRef}
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                disabled={loading}
                placeholder="017XXXXXXXX"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
              />
              {mobile && !isValidMobile(mobile) && (
                <p className="text-red-300 text-xs mt-1">
                  সঠিক মোবাইল নম্বর দিন
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-white/60 mb-2">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-white/60 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {capsLockOn && (
                <p className="text-yellow-300 text-xs mt-1">
                  ⚠️ Caps Lock চালু আছে
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              {loading ? "লগইন হচ্ছে..." : "🔐 লগইন করুন"}
            </button>
          </form>

          {/* Help */}
          <div className="mt-8 text-center text-white/40 text-xs">
            সাহায্যের জন্য যোগাযোগ করুন: support@loantrack.com
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          🔐 আপনার তথ্য সম্পূর্ণ নিরাপদ
        </p>
      </div>
    </div>
  );
}