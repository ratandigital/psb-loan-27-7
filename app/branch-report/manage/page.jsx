"use client";
import { useState } from "react";
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

export default function BranchReportManagePage() {
  const [branchCode, setBranchCode] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function fetchData() {
    setError("");
    setSuccessMsg("");
    setData(null);

    if (!branchCode || !month || !year) {
      setError("সব ফিল্ড পূরণ করুন।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/branch-report/manage?branchCode=${branchCode}&month=${month}&year=${year}`
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || "ডাটা লোড ব্যর্থ হয়েছে");

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteData() {
    setDeleting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/branch-report/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchCode, month, year }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || "ডিলিট ব্যর্থ হয়েছে");

      setData(null);
      setShowConfirm(false);
      setSuccessMsg("✅ ডাটা সফলভাবে ডিলিট হয়েছে।");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const monthLabel =
    MONTHS.find((m) => m.value === Number(month))?.label || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Branch Report Manage
            </h1>
            <p className="text-white/60 text-sm mt-1">
              নির্দিষ্ট শাখার রিপোর্ট দেখুন ও মুছুন
            </p>
          </div>

          <Link
            href="/upload"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm transition"
          >
            ← Upload Page
          </Link>
        </div>

        {/* Filter Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">

          <h2 className="text-white/80 font-semibold text-sm mb-4 uppercase tracking-wider">
            🔍 ফিল্টার করুন
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <input
              type="number"
              placeholder="শাখা কোড"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            />

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            >
              <option value="" className="text-blue-900">
                মাস
              </option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="text-blue-900">
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            >
              <option value="" className="text-blue-900">
                বছর
              </option>
              {YEARS.map((y) => (
                <option key={y} value={y} className="text-blue-900">
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-6 py-2.5 rounded-xl transition"
            >
              {loading ? "লোড হচ্ছে..." : "🔍 দেখুন"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-5 py-4 rounded-xl mb-6">
            ❌ {error}
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="bg-green-500/20 border border-green-400/30 text-green-200 px-5 py-4 rounded-xl mb-6">
            {successMsg}
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-semibold">
                📊 রিপোর্ট তথ্য
              </h2>
              <span className="text-white/50 text-sm">
                {monthLabel} {year} — শাখা #{branchCode}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-6 text-center mb-6">
              <p className="text-3xl font-bold text-yellow-400">
                {data.totalRecords}
              </p>
              <p className="text-white/60 text-sm mt-1">
                মোট রেকর্ড
              </p>
            </div>

            {data.totalRecords > 0 && (
              <>
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 px-6 py-3 rounded-xl text-sm transition"
                  >
                    🗑️ সব ডাটা ডিলিট করুন
                  </button>
                ) : (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-5">
                    <p className="text-red-200 text-sm mb-4">
                      ⚠️ শাখা <strong>{branchCode}</strong> এর{" "}
                      <strong>{monthLabel} {year}</strong> এর{" "}
                      <strong>{data.totalRecords}</strong> টি রেকর্ড
                      স্থায়ীভাবে মুছে যাবে।
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={deleteData}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition"
                      >
                        {deleting ? "ডিলিট হচ্ছে..." : "✅ হ্যাঁ, ডিলিট করুন"}
                      </button>

                      <button
                        onClick={() => setShowConfirm(false)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm transition"
                      >
                        ❌ বাতিল
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}