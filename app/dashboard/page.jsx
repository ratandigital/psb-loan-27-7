"use client";

import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────
   DATA FETCHING HOOK
───────────────────────────────────────────── */
function useDashboard(month, year) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/dashboard?month=${month}&year=${year}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [month, year]);

  return { data, loading, error };
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function BranchAnalyticsDashboard() {
  const { data, loading, error } = useDashboard(6, 2026);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-yellow-400 animate-spin" />
        <p className="text-white/70 text-sm animate-pulse">
          ড্যাশবোর্ড লোড হচ্ছে…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="bg-red-500/20 border border-red-400/40 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-white font-semibold">ডেটা লোড ব্যর্থ হয়েছে</p>
          <p className="text-white/50 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { branch, employees, loans, user, alert } = data;

  const summaryCards = [
    { title: "মোট সদস্য", value: branch?.totalMember, color: "yellow", icon: "👥" },
    { title: "ঋণগ্রহীতা সদস্য", value: branch?.loaneeMember, color: "green", icon: "🤝" },
    { title: "মোট কর্মী", value: employees?.totalRecords, color: "blue", icon: "👤" },
    { title: "সক্রিয় কর্মী", value: employees?.activeCount, color: "emerald", icon: "✅" },
  ];

  const loanStats = [
    { label: "মোট ঋণ রেকর্ড", value: loans?.totalLoan, icon: "📑" },
    { label: "মোট বিতরণ", value: loans?.totalDisburse, icon: "💸" },
    { label: "বর্তমান স্থিতি", value: loans?.totalOutstanding, icon: "📊" },
    { label: "এই মাসের আদায়", value: loans?.totalRepayment, icon: "✔️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col lg:flex-row justify-between gap-6">

          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              📊 Branch Analytics
            </h1>
            <p className="text-white/50 mt-1">
              {branch?.branchName} ({branch?.branchCode}) — {branch?.month}/{branch?.year}
            </p>
          </div>

          {/* User Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white min-w-[260px]">
            <p className="font-semibold text-lg">
              👋 {user?.fullName}
            </p>
            <p className="text-white/50 text-sm">
              {user?.designation} ({user?.role})
            </p>
            <p className="text-white/40 text-xs mt-2">
              Branch Code: {user?.branchCode}
            </p>
          </div>
        </div>

        {/* ── ALERT SUMMARY ── */}
        {alert?.count > 0 && (
          <a
            href="/tomorrow-alert"
            className="block bg-red-500/20 border border-red-400/40 rounded-2xl p-6 hover:bg-red-500/30 transition animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-red-300 font-semibold text-lg">
                  ⚠️ আজকের এলার্ট
                </p>
                <p className="text-white text-sm mt-1">
                  {alert.count} টি ঋণ আগামীকাল খেলাপি হবে
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-red-400">
                  ৳ {alert.totalOutstanding?.toLocaleString()}
                </p>
                <p className="text-white/50 text-xs">
                  মোট বকেয়া
                </p>
              </div>
            </div>
          </a>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, i) => (
            <SummaryCard key={i} {...card} />
          ))}
        </div>

        {/* ── LOAN OVERVIEW ── */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <SectionTitle icon="🏦" title="Loan Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {loanStats.map((stat, i) => (
              <MiniStat key={i} {...stat} />
            ))}
          </div>
        </div>

        {/* ── PERFORMANCE BAR ── */}
        <PerformanceBar
          label="আদায় হার"
          current={loans?.totalRepayment}
          total={loans?.totalDisburse}
        />

        <p className="text-center text-white/30 text-xs">
          সর্বশেষ আপডেট: {new Date().toLocaleString("bn-BD")}
        </p>

      </div>
    </div>
  );
}

/* ───────── COMPONENTS ───────── */

function SectionTitle({ icon, title }) {
  return (
    <h2 className="text-white font-semibold text-lg flex items-center gap-2">
      {icon} {title}
    </h2>
  );
}

function SummaryCard({ title, value, color, icon }) {
  const colors = {
    yellow: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400",
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:scale-[1.03] transition">
      <p className="text-xl mb-2">{icon}</p>
      <p className="text-white/60 text-sm">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value?.toLocaleString() ?? "—"}
      </p>
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <p className="text-2xl">{icon}</p>
      <p className="text-white font-bold text-xl mt-2">
        {value?.toLocaleString() ?? "—"}
      </p>
      <p className="text-white/50 text-xs mt-1">{label}</p>
    </div>
  );
}

function PerformanceBar({ label, current, total }) {
  const pct =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const color =
    pct >= 80 ? "bg-green-400" :
    pct >= 50 ? "bg-yellow-400" :
    "bg-red-400";

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
      <div className="flex justify-between mb-3 text-white">
        <span>{label}</span>
        <span className="font-bold">{pct}%</span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-white/40 text-xs">
        <span>আদায়: ৳ {Number(current).toLocaleString()}</span>
        <span>বিতরণ: ৳ {Number(total).toLocaleString()}</span>
      </div>
    </div>
  );
}