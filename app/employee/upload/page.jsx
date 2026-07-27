"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function EmployeeUploadPage() {
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [branchCode, setBranchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file || !branchCode) {
      setResult({ success: false, message: "ফাইল এবং শাখা কোড আবশ্যক" });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("branchCode", branchCode);

    try {
      const res = await fetch("/api/employee/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "আপলোড ব্যর্থ হয়েছে");

      setResult({ success: true, message: data.message });

      setFile(null);
      setBranchCode("");
      if (fileRef.current) fileRef.current.value = "";

    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              কর্মী আপলোড
            </h1>
            <p className="text-white/60 text-sm mt-1">
              শাখা অনুযায়ী কর্মীর এক্সেল ফাইল আপলোড করুন
            </p>
          </div>

          <Link
            href="/employee/manage"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm transition"
          >
            ⚙️ ম্যানেজ →
          </Link>
        </div>

        {/* Upload Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <form onSubmit={handleUpload} className="space-y-5">

            {/* Branch Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-xs font-medium">
                শাখা কোড <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="যেমন: 1021"
                className="bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            {/* File Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-xs font-medium">
                এক্সেল ফাইল (.xlsx, .xls) <span className="text-red-400">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="bg-white/10 border border-white/20 text-white file:bg-yellow-400 file:text-blue-900 file:border-0 file:px-4 file:py-2 file:rounded-lg file:font-semibold rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                  আপলোড হচ্ছে...
                </>
              ) : (
                "📤 কর্মী আপলোড করুন"
              )}
            </button>
          </form>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mt-6 px-5 py-4 rounded-xl border flex items-center gap-3 ${
              result.success
                ? "bg-green-500/20 border-green-400/30 text-green-200"
                : "bg-red-500/20 border-red-400/30 text-red-200"
            }`}
          >
            <span className="text-xl">
              {result.success ? "✅" : "❌"}
            </span>
            <p className="font-medium text-sm">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}