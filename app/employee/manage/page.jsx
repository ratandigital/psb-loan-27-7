"use client";

import { useState } from "react";
import Link from "next/link";

export default function EmployeeManagePage() {
  const [branchCode, setBranchCode] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ================= Fetch ================= */
  async function fetchData() {
    setError("");
    setSuccessMsg("");
    setData(null);

    if (!branchCode || branchCode.trim() === "") {
      setError("শাখা কোড দিন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/employee/manage?branchCode=${branchCode}`
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= Delete ================= */
  async function deleteData() {
    setDeleting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/employee/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchCode: Number(branchCode) }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setSuccessMsg(result.message || "✅ ডাটা সফলভাবে ডিলিট হয়েছে।");
      setData(null);
      setShowConfirm(false);
      setBranchCode("");

    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  /* ================= Enter Key Handler ================= */
  function handleKeyPress(e) {
    if (e.key === "Enter" && !loading) {
      fetchData();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-500/30 border border-blue-400/40 rounded-xl flex items-center justify-center text-xl">
                👥
              </span>
              কর্মী ম্যানেজ
            </h1>
            <p className="text-white/40 text-sm mt-2">
              শাখা অনুযায়ী কর্মীর ডাটা দেখুন ও মুছুন
            </p>
          </div>

          <Link
            href="/employee/list"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            <span>📋</span>
            সকল কর্মী
          </Link>
        </div>

        {/* Filter Card */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-white/60 font-semibold text-xs mb-4 uppercase tracking-widest flex items-center gap-2">
            <span>🔍</span>
            ফিল্টার করুন
          </h2>

          <div className="flex flex-col md:flex-row gap-4">

            <input
              type="number"
              placeholder="শাখা কোড (যেমন: 101)"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-blue-900 font-bold px-8 py-3 rounded-xl transition shadow-lg active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                  লোড হচ্ছে...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  ডাটা দেখুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/15 border border-red-400/30 text-red-300 px-5 py-4 rounded-xl flex items-center gap-3 mb-6 shadow-lg animate-fade-in">
            <span className="text-xl">❌</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="bg-green-500/15 border border-green-400/30 text-green-300 px-5 py-4 rounded-xl flex items-center gap-3 mb-6 shadow-lg animate-fade-in">
            <span className="text-xl">✅</span>
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Result Card */}
        {data && (
          <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl overflow-hidden shadow-xl">

            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-500/30 border border-indigo-400/40 rounded-lg flex items-center justify-center text-xs font-mono">
                  {branchCode}
                </span>
                শাখার তথ্য
              </h2>
              <span className="text-white/40 text-xs">
                {new Date().toLocaleDateString('bn-BD')}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              
              {/* Total Employees */}
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-4xl font-bold text-blue-300">
                  {data.totalEmployees}
                </p>
                <p className="text-white/60 text-sm mt-2">মোট কর্মী</p>
              </div>

              {/* Active Employees */}
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-4xl font-bold text-green-300">
                  {data.activeCount ?? 0}
                </p>
                <p className="text-white/60 text-sm mt-2">সক্রিয় কর্মী</p>
              </div>

              {/* Inactive Employees */}
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-400/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚫</span>
                </div>
                <p className="text-4xl font-bold text-red-300">
                  {data.inactiveCount ?? 0}
                </p>
                <p className="text-white/60 text-sm mt-2">নিষ্ক্রিয় কর্মী</p>
              </div>
            </div>

            {/* Delete Section */}
            {data.totalEmployees > 0 && (
              <div className="px-6 pb-6">
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-300 px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    সকল ডাটা ডিলিট করুন
                  </button>
                ) : (
                  <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-red-200 font-bold mb-2">
                          আপনি কি নিশ্চিত?
                        </p>
                        <p className="text-red-300/80 text-sm">
                          শাখা <strong className="text-red-200">#{branchCode}</strong> এর{" "}
                          <strong className="text-red-200">{data.totalEmployees}</strong> জন কর্মীর
                          সমস্ত ডাটা স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={deleteData}
                        disabled={deleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                      >
                        {deleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ডিলিট হচ্ছে...
                          </>
                        ) : (
                          <>
                            <span>✅</span>
                            হ্যাঁ, ডিলিট করুন
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowConfirm(false)}
                        disabled={deleting}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <span>❌</span>
                        বাতিল
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {data.totalEmployees === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">📭</span>
                </div>
                <p className="text-white font-semibold text-lg">
                  কোনো ডাটা পাওয়া যায়নি
                </p>
                <p className="text-white/40 text-sm mt-2">
                  শাখা #{branchCode} তে কোনো কর্মী নেই
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!data && !error && !successMsg && (
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-5 flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-blue-200 font-semibold mb-1">
                কীভাবে ব্যবহার করবেন?
              </p>
              <ul className="text-blue-300/80 text-sm space-y-1">
                <li>১. শাখা কোড লিখুন (যেমন: 101)</li>
                <li>২. "ডাটা দেখুন" বাটনে ক্লিক করুন</li>
                <li>৩. প্রয়োজনে ডাটা ডিলিট করতে পারবেন</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}