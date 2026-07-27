"use client";
import { useRef, useState } from "react";
import Link from "next/link";

const MONTHS = [
  { value: 1, label: "জানুয়ারি" },
  { value: 2, label: "ফেব্রুয়ারি" },
  { value: 3, label: "মার্চ" },
  { value: 4, label: "এপ্রিল" },
  { value: 5, label: "মে" },
  { value: 6, label: "জুন" },
  { value: 7, label: "জুলাই" },
  { value: 8, label: "আগস্ট" },
  { value: 9, label: "সেপ্টেম্বর" },
  { value: 10, label: "অক্টোবর" },
  { value: 11, label: "নভেম্বর" },
  { value: 12, label: "ডিসেম্বর" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function BranchReportUploadPage() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file || !month || !year) {
      setResult({ success: false, message: "সব ফিল্ড পূরণ করুন" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResult({ success: false, message: "ফাইল ৫MB এর বেশি হতে পারবে না" });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", month);
    formData.append("year", year);

    try {
      const res = await fetch("/api/branch-report/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "আপলোড ব্যর্থ হয়েছে");

      setResult({ success: true, message: data.message });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  const monthLabel =
    MONTHS.find((m) => m.value === Number(month))?.label || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Branch Report Upload
            </h1>
            <p className="text-white/60 text-sm mt-1">
              লগইনকৃত শাখার মাসিক রিপোর্ট আপলোড করুন
            </p>
          </div>

          <Link
            href="/branch-report/manage"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm transition"
          >
            ⚙️ Manage
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <form onSubmit={handleUpload} className="space-y-6">

            {/* Month & Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-medium">
                  মাস *
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="text-blue-900">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-medium">
                  বছর *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="text-blue-900">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Selected Badge */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70">
              📅 নির্বাচিত সময়কাল:{" "}
              <span className="text-white font-medium">
                {monthLabel}, {year}
              </span>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-2">
                Excel ফাইল (.xlsx, .xls) *
              </label>

              <label
                className="flex flex-col items-center justify-center w-full
                border-2 border-dashed border-white/30 rounded-2xl py-10
                hover:border-yellow-400 hover:bg-white/5 transition cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />

                <span className="text-white text-sm">
                  {file ? `📄 ${file.name}` : "ফাইল নির্বাচন করতে ক্লিক করুন"}
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              {loading ? "আপলোড হচ্ছে..." : "📤 রিপোর্ট আপলোড করুন"}
            </button>

          </form>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`mt-6 px-5 py-4 rounded-xl border text-sm ${
              result.success
                ? "bg-green-500/20 border-green-400/30 text-green-200"
                : "bg-red-500/20 border-red-400/30 text-red-200"
            }`}
          >
            {result.success ? "✅ " : "❌ "}
            {result.message}
          </div>
        )}

        <p className="text-center text-white/40 text-xs mt-8">
          একই Branch + মাস + বছর পুনরায় আপলোড করা যাবে না।
        </p>

      </div>
    </div>
  );
}