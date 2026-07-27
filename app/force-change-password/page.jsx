"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForceChangePassword() {
  const router = useRouter();
  const newPasswordInputRef = useRef(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    newPasswordInputRef.current?.focus();
  }, []);

  const isPasswordValid = useMemo(() => {
    if (newPassword.length === 0) return false;
    if (newPassword === "123456789") return false;
    if (newPassword.includes(" ")) return false;
    return newPassword.length >= 8;
  }, [newPassword]);

  const isPasswordsMatch = useMemo(
    () => newPassword === confirmPassword && newPassword.length > 0,
    [newPassword, confirmPassword]
  );

  const isFormValid = isPasswordValid && isPasswordsMatch;

  const handlePasswordKeyDown = (e) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isFormValid) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে এবং দুটি একই হতে হবে");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে");
        setLoading(false);
        return;
      }

      setSuccess("✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!");
      localStorage.setItem("forceReset", "false");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setError("সার্ভার সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
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
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-white">
              পাসওয়ার্ড পরিবর্তন করুন
            </h1>
            <p className="text-white/60 text-sm mt-2">
              আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে একটি নতুন পাসওয়ার্ড সেট করুন
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-5">
              ❌ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-500/20 border border-green-400/30 text-green-200 text-sm px-4 py-3 rounded-xl mb-5">
              {success}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">

            {/* New Password */}
            <div>
              <label className="block text-xs text-white/60 mb-2">
                নতুন পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  ref={newPasswordInputRef}
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  disabled={loading}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-white/60 text-sm"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              {newPassword && !isPasswordValid && (
                <p className="text-red-300 text-xs mt-1">
                  কমপক্ষে ৮ অক্ষর দিন, স্পেস ব্যবহার করবেন না
                </p>
              )}

              {capsLockOn && (
                <p className="text-yellow-300 text-xs mt-1">
                  ⚠️ Caps Lock চালু আছে
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-white/60 mb-2">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="পুনরায় লিখুন"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-2.5 text-white/60 text-sm"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword && (
                <p
                  className={`text-xs mt-1 ${
                    isPasswordsMatch
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  {isPasswordsMatch
                    ? "✓ পাসওয়ার্ড মিলেছে"
                    : "❌ পাসওয়ার্ড মিলছে না"}
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/70">
              💡 টিপস: কমপক্ষে ৮ অক্ষর ব্যবহার করুন এবং সহজ পাসওয়ার্ড এড়িয়ে চলুন।
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              {loading ? "পরিবর্তন হচ্ছে..." : "🔄 পাসওয়ার্ড পরিবর্তন করুন"}
            </button>

            <p className="text-center text-white/40 text-xs">
              সফল হলে আপনাকে ড্যাশবোর্ডে পাঠানো হবে
            </p>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          🔐 আপনার পাসওয়ার্ড এনক্রিপ্ট করা হবে
        </p>
      </div>
    </div>
  );
}