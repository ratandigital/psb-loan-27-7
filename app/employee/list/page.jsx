"use client";

import { useEffect, useState } from "react";

/* ───────────────────────────────────────────── */

const DESIGNATIONS = [
  "Senior Officer",
  "Officer (general)",
  "Junior Officer (Field)",
  "Computer Operator",
  "Field Assistant",
  "Cash Assistant",
  "Office Assistant",
];

const ROLES = [
  "Branch Manager",
  "Branch 2nd Officer G",
  "Branch 2nd Officer T",
  "Branch FA",
  "Cash Assistant",
  "General Employee",
];

const inputStyle =
  "w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200";

const labelStyle = "block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide";

/* ── Helpers ── */
function StatusBadge({ status }) {
  const isActive = status === "Active" || status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-500/20 text-green-300 border border-green-500/30"
          : "bg-red-500/20 text-red-300 border border-red-500/30"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`} />
      {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function SkeletonRow({ cols }) {
  return (
    <tr className="border-t border-white/8 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-white/10 rounded-lg" />
        </td>
      ))}
    </tr>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium border backdrop-blur-sm animate-fade-in ${
        toast.type === "error"
          ? "bg-red-500/90 border-red-400/40 text-white"
          : "bg-green-500/90 border-green-400/40 text-white"
      }`}
    >
      {toast.message}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function EmployeeListPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [branchCode, setBranchCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [role, setRole] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [toast, setToast] = useState(null);

  /* ── Toast Helper ── */
  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Fetch Role ── */
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      const result = await res.json();
      if (result.loggedIn) setRole(result.role);
    }
    fetchUser();
  }, []);

  /* ── Debounce Search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Load Employees ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Build query string - only add branchCode if it exists
        const params = new URLSearchParams();
        if (branchCode) params.append("branchCode", branchCode);
        if (search) params.append("search", search);
        params.append("page", page);

        const res = await fetch(`/api/employee/manage?${params.toString()}`);
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [branchCode, search, page]);

  /* ── Save Edit ── */
  async function handleSave() {
    if (!editing) return;

    // ── Validation ──
    if (!editing.employeeId?.trim()) {
      showToast("কর্মী আইডি দিন", "error");
      return;
    }
    if (!editing.fullName?.trim()) {
      showToast("পূর্ণ নাম দিন", "error");
      return;
    }
    if (!editing.mobile?.trim()) {
      showToast("মোবাইল নম্বর দিন", "error");
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch("/api/employee/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalEmployeeId: editing._originalEmployeeId,
          branchCode: editing.branchCode,
          employeeId: editing.employeeId,
          fullName: editing.fullName,
          designation: editing.designation,
          role: editing.role,
          mobile: editing.mobile,
          email: editing.email,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setData((prev) => ({
          ...prev,
          employees: prev.employees.map((e) =>
            e.employeeId === editing._originalEmployeeId
              ? result.employee
              : e
          ),
        }));
        setEditing(null);
        showToast("✅ কর্মী তথ্য সফলভাবে আপডেট হয়েছে");
      } else {
        showToast(result.error || "আপডেট ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার সমস্যা হয়েছে", "error");
    } finally {
      setSaveLoading(false);
    }
  }

  /* ── Toggle Status ── */
  async function handleToggleStatus(emp) {
    setLoadingAction(emp.employeeId);
    try {
      const res = await fetch("/api/employee/toggle-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          branchCode: emp.branchCode,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData((prev) => ({
          ...prev,
          employees: prev.employees.map((e) =>
            e.employeeId === emp.employeeId
              ? { ...e, status: result.status }
              : e
          ),
        }));
        showToast(`✅ ${emp.fullName} এর স্ট্যাটাস পরিবর্তন হয়েছে`);
      }
    } catch {
      showToast("স্ট্যাটাস পরিবর্তন ব্যর্থ", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  /* ── Reset Password ── */
  async function handleResetPassword(emp) {
    if (!confirm(`"${emp.fullName}" এর পাসওয়ার্ড রিসেট করবেন?\nনতুন পাসওয়ার্ড হবে: 123456`))
      return;
    setLoadingAction(emp.employeeId + "_reset");
    try {
      await fetch("/api/employee/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          branchCode: emp.branchCode,
        }),
      });
      showToast("🔑 পাসওয়ার্ড রিসেট হয়েছে → 123456");
    } catch {
      showToast("পাসওয়ার্ড রিসেট ব্যর্থ", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  /* ── Reset Filters ── */
  function handleReset() {
    setBranchCode("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  /* ── Open Modal ── */
  function openEdit(emp) {
    setEditing({
      ...emp,
      _originalEmployeeId: emp.employeeId, // preserve original
    });
  }

  const totalPages = data?.totalPages || 1;
  const canManage = role === "Branch Manager" || role === "Admin";
  const activeCount = data?.employees?.filter((e) => e.status === "Active" || e.status === "ACTIVE").length ?? 0;
  const inactiveCount = data?.employees?.filter((e) => e.status !== "Active" && e.status !== "ACTIVE").length ?? 0;

  /* ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white">
      <Toast toast={toast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-500/30 border border-blue-400/40 rounded-xl flex items-center justify-center text-xl shadow-lg">
                👥
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  কর্মী তালিকা
                </h1>
                <p className="text-white/40 text-sm mt-0.5">
                  সকল কর্মীর তথ্য পরিচালনা করুন
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {data && (
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-500/30 rounded-lg flex items-center justify-center text-xs">👥</div>
                <div>
                  <p className="text-white/40 text-xs">মোট কর্মী</p>
                  <p className="text-white font-bold text-sm leading-none mt-0.5">
                    {data.totalEmployees ?? data.employees?.length ?? 0}
                  </p>
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-green-500/30 rounded-lg flex items-center justify-center text-xs">✅</div>
                <div>
                  <p className="text-green-300/60 text-xs">সক্রিয়</p>
                  <p className="text-green-300 font-bold text-sm leading-none mt-0.5">{activeCount}</p>
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-red-500/30 rounded-lg flex items-center justify-center text-xs">🚫</div>
                <div>
                  <p className="text-red-300/60 text-xs">নিষ্ক্রিয়</p>
                  <p className="text-red-300 font-bold text-sm leading-none mt-0.5">{inactiveCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FILTER CARD ── */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5 mb-6 shadow-xl">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">
            🔍 ফিল্টার ও অনুসন্ধান
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelStyle}>শাখা কোড (ঐচ্ছিক)</label>
              <input
                type="number"
                placeholder="সব শাখা দেখাবে"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>অনুসন্ধান</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">
                  🔎
                </span>
                <input
                  type="text"
                  placeholder="নাম / আইডি / মোবাইল..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`${inputStyle} pl-9`}
                />
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleReset}
                className="w-full bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-blue-900 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-yellow-400/20"
              >
                ↺ রিসেট
              </button>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
            ❌ {error}
          </div>
        )}

        {/* ── TABLE CARD ── */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl overflow-hidden shadow-xl">

          {/* Table Top Bar */}
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="text-white/60 text-sm font-medium">
              {loading
                ? "তথ্য লোড হচ্ছে..."
                : `${data?.employees?.length ?? 0} জন কর্মী${branchCode ? ` (শাখা: ${branchCode})` : ' (সব শাখা)'}`}
            </p>
            <p className="text-white/30 text-xs">
              পৃষ্ঠা {page} / {totalPages}
            </p>
          </div>

          {/* ── DESKTOP TABLE ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/8">
                  {["শাখা", "কর্মী আইডি", "নাম", "পদবি", "ভূমিকা", "মোবাইল", "ইমেইল", "স্ট্যাটাস"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-white/40 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                  {canManage && (
                    <th className="px-5 py-3.5 text-center text-white/40 font-semibold text-xs uppercase tracking-wider">
                      অ্যাকশন
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} cols={canManage ? 9 : 8} />
                    ))
                  : data?.employees?.map((emp, idx) => (
                      <tr
                        key={emp.employeeId}
                        className={`border-t border-white/8 hover:bg-white/5 transition-colors duration-150 ${
                          idx % 2 !== 0 ? "bg-white/3" : ""
                        }`}
                      >
                        {/* Branch Code */}
                        <td className="px-5 py-4">
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold">
                            {emp.branchCode}
                          </span>
                        </td>

                        {/* ID */}
                        <td className="px-5 py-4">
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold">
                            {emp.employeeId}
                          </span>
                        </td>

                        {/* Name + Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.fullName} />
                            <span className="font-medium text-white/90 whitespace-nowrap">
                              {emp.fullName}
                            </span>
                          </div>
                        </td>

                        {/* Designation */}
                        <td className="px-5 py-4 text-white/60 text-sm whitespace-nowrap">
                          {emp.designation || "—"}
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
                            {emp.role || "—"}
                          </span>
                        </td>

                        {/* Mobile */}
                        <td className="px-5 py-4 text-white/60 font-mono text-sm whitespace-nowrap">
                          {emp.mobile}
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-white/50 text-sm">
                          {emp.email || "—"}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={emp.status} />
                        </td>

                        {/* Actions */}
                        {canManage && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <ActionButton
                                title="সম্পাদনা"
                                color="yellow"
                                icon="✏️"
                                onClick={() => openEdit(emp)}
                              />
                              <ActionButton
                                title="স্ট্যাটাস পরিবর্তন"
                                color="red"
                                icon={loadingAction === emp.employeeId ? "⏳" : "🚫"}
                                disabled={loadingAction === emp.employeeId}
                                onClick={() => handleToggleStatus(emp)}
                              />
                              <ActionButton
                                title="পাসওয়ার্ড রিসেট"
                                color="purple"
                                icon={
                                  loadingAction === emp.employeeId + "_reset"
                                    ? "⏳"
                                    : "🔑"
                                }
                                disabled={
                                  loadingAction === emp.employeeId + "_reset"
                                }
                                onClick={() => handleResetPassword(emp)}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="md:hidden divide-y divide-white/8">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse space-y-2.5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                        <div className="h-3 bg-white/10 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))
              : data?.employees?.map((emp) => (
                  <div key={emp.employeeId} className="p-4 hover:bg-white/4 transition-colors">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.fullName} />
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">
                            {emp.fullName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-mono">
                              {emp.branchCode}
                            </span>
                            <span className="text-white/40 text-xs font-mono">
                              {emp.employeeId}
                            </span>
                          </div>
                          {emp.designation && (
                            <span className="text-white/30 text-xs">
                              {emp.designation}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={emp.status} />
                    </div>

                    {/* Card Info */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <p className="text-white/30 text-xs mb-0.5">মোবাইল</p>
                        <p className="text-white/80 text-xs font-mono">{emp.mobile}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <p className="text-white/30 text-xs mb-0.5">ভূমিকা</p>
                        <p className="text-purple-300 text-xs font-semibold">{emp.role || "—"}</p>
                      </div>
                      {emp.email && (
                        <div className="col-span-2 bg-white/5 rounded-lg px-3 py-2">
                          <p className="text-white/30 text-xs mb-0.5">ইমেইল</p>
                          <p className="text-white/60 text-xs">{emp.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    {canManage && (
                      <div className="flex gap-2 pt-3 border-t border-white/8">
                        <button
                          onClick={() => openEdit(emp)}
                          className="flex-1 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/25 text-yellow-300 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                          ✏️ সম্পাদনা
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          disabled={loadingAction === emp.employeeId}
                          className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {loadingAction === emp.employeeId ? "⏳" : "🚫 স্ট্যাটাস"}
                        </button>
                        <button
                          onClick={() => handleResetPassword(emp)}
                          disabled={loadingAction === emp.employeeId + "_reset"}
                          className="flex-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-purple-300 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {loadingAction === emp.employeeId + "_reset" ? "⏳" : "🔑 রিসেট"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
          </div>

          {/* ── EMPTY STATE ── */}
          {!loading && data?.employees?.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">👤</div>
              <p className="text-white/50 font-medium">কোনো কর্মী পাওয়া যায়নি</p>
              <p className="text-white/30 text-sm mt-1">
                {branchCode ? 'এই শাখায় কর্মী নেই অথবা ফিল্টার পরিবর্তন করুন' : 'ফিল্টার পরিবর্তন করে দেখুন'}
              </p>
            </div>
          )}
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/12 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← আগে
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      page === p
                        ? "bg-yellow-400 text-blue-900 shadow-lg shadow-yellow-400/25"
                        : "bg-white/8 hover:bg-white/15 border border-white/12"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/12 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              পরে →
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          ── EDIT MODAL ──
      ══════════════════════════════════════════════ */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="bg-slate-900/98 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-yellow-400/15 border border-yellow-400/25 rounded-xl flex items-center justify-center">
                  ✏️
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">কর্মী সম্পাদনা</h2>
                  <p className="text-white/30 text-xs">
                    শাখা: {editing.branchCode} • আইডি: {editing._originalEmployeeId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

              {/* Row 1: ID + Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>কর্মী আইডি *</label>
                  <input
                    type="text"
                    value={editing.employeeId}
                    onChange={(e) =>
                      setEditing({ ...editing, employeeId: e.target.value })
                    }
                    className={inputStyle}
                    placeholder="যেমন: EMP001"
                  />
                </div>
                <div>
                  <label className={labelStyle}>পূর্ণ নাম *</label>
                  <input
                    type="text"
                    value={editing.fullName}
                    onChange={(e) =>
                      setEditing({ ...editing, fullName: e.target.value })
                    }
                    className={inputStyle}
                    placeholder="কর্মীর নাম"
                  />
                </div>
              </div>

              {/* Row 2: Designation + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>পদবি</label>
                  <select
                    value={editing.designation || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, designation: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option value="" className="text-black">পদবি নির্বাচন করুন</option>
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d} className="text-black bg-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>ভূমিকা</label>
                  <select
                    value={editing.role || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, role: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option value="" className="text-black">ভূমিকা নির্বাচন করুন</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="text-black bg-white">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Mobile + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>মোবাইল *</label>
                  <input
                    type="text"
                    value={editing.mobile}
                    onChange={(e) =>
                      setEditing({ ...editing, mobile: e.target.value })
                    }
                    className={inputStyle}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className={labelStyle}>ইমেইল</label>
                  <input
                    type="email"
                    value={editing.email || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, email: e.target.value })
                    }
                    className={inputStyle}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300/80 flex items-start gap-2">
                <span className="mt-0.5">ℹ️</span>
                <span>
                  কর্মী আইডি পরিবর্তন করলে সিস্টেমে লগইন আইডিও পরিবর্তন হয়ে যাবে। সতর্কতার সাথে পরিবর্তন করুন।
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/15 rounded-xl text-sm font-medium transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  "✅ সংরক্ষণ করুন"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Action Button Component ── */
function ActionButton({ title, color, icon, onClick, disabled }) {
  const colors = {
    yellow: "bg-yellow-400/15 hover:bg-yellow-400/30 border-yellow-400/25 text-yellow-300",
    red: "bg-red-500/15 hover:bg-red-500/30 border-red-500/25 text-red-300",
    purple: "bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/25 text-purple-300",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 border rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${colors[color]}`}
    >
      {icon}
    </button>
  );
}