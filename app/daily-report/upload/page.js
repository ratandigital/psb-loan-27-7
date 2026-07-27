"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

/* ✅ FIX: Prevent Hydration Error */
const Select = dynamic(() => import("react-select"), {
  ssr: false,
});

export default function DailyReportPage() {
  const [faList, setFaList] = useState([]);
  const [reports, setReports] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  /* ✅ Load FA List */
  useEffect(() => {
    async function loadFA() {
      setLoading(true);
      try {
        const res = await fetch("/api/employee/list-fa");
        const data = await res.json();

        if (data.success) {
          const formatted = data.data.map((fa) => ({
            value: fa.employeeId,
            label: `${fa.fullName} (${fa.employeeId})`,
            fullName: fa.fullName,
          }));
          setFaList(formatted);
        }
      } catch (error) {
        console.error("Error loading FA list:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFA();
  }, []);

  /* ✅ Multi Select */
  function handleSelect(selected) {
    if (!selected) {
      setReports([]);
      return;
    }

    const updated = selected.map((fa) => {
      const existing = reports.find((r) => r.fieldAssistantId === fa.value);

      return (
        existing || {
          fieldAssistantId: fa.value,
          fieldAssistantName: fa.fullName,
          newMember: 0,
          dpsCount: 0,
          dpsAmount: 0,
          collection: 0,
          runningLoan: 0,
          disburse: 0,
          totalCollection: 0,
          grandTotal: 0,
        }
      );
    });

    setReports(updated);
  }

  /* ✅ Update Field + Auto Calculate */
  function updateField(index, field, value) {
    const updated = [...reports];
    updated[index][field] = Number(value) || 0;

    const totalCollection =
      Number(updated[index].dpsAmount || 0) +
      Number(updated[index].collection || 0) +
      Number(updated[index].runningLoan || 0);

    const grandTotal = totalCollection - Number(updated[index].disburse || 0);

    updated[index].totalCollection = totalCollection;
    updated[index].grandTotal = grandTotal;

    setReports(updated);
  }

  /* ✅ Handle Focus - Clear 0 */
  function handleFocus(e) {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  }

  /* ✅ Handle Blur - Set 0 if empty */
  function handleBlur(index, field, e) {
    if (e.target.value === "" || e.target.value === null) {
      updateField(index, field, 0);
    }
  }

  /* ✅ Branch Totals */
  const branchTotalCollection = reports.reduce(
    (sum, r) => sum + (r.totalCollection || 0),
    0
  );

  const branchGrandTotal = reports.reduce(
    (sum, r) => sum + (r.grandTotal || 0),
    0
  );

  const branchTotalNewMembers = reports.reduce(
    (sum, r) => sum + (r.newMember || 0),
    0
  );

  const branchTotalDps = reports.reduce(
    (sum, r) => sum + (r.dpsCount || 0),
    0
  );

  const branchTotalDisburse = reports.reduce(
    (sum, r) => sum + (r.disburse || 0),
    0
  );

  /* ✅ Save All Reports */
  async function saveAll() {
    if (reports.length === 0) {
      setResult({
        success: false,
        error: "কোনো রিপোর্ট নেই। প্রথমে মাঠ সহকারী নির্বাচন করুন।",
      });
      return;
    }

    setSaveLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        // Auto hide success message after 3 seconds
        setTimeout(() => setResult(null), 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: "সার্ভার সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      });
    } finally {
      setSaveLoading(false);
    }
  }

  /* ✅ Clear All */
  function clearAll() {
    if (confirm("সকল ডাটা মুছে ফেলতে চান?")) {
      setReports([]);
      setResult(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500/30 border border-blue-400/40 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              📊
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                দৈনিক রিপোর্ট এন্ট্রি
              </h1>
              <p className="text-white/40 text-sm mt-0.5">
                মাঠ সহকারীদের দৈনিক কর্মকাণ্ড রেকর্ড করুন
              </p>
            </div>
          </div>

          {/* ✅ Date Display */}
          <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-2 inline-block mt-4">
            <span className="text-white/60 text-xs mr-2">📅 তারিখ:</span>
            <span className="text-white font-semibold text-sm">
              {new Date().toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* ✅ Multi Select */}
        <div className="mb-8">
          <label className="block text-white/60 text-sm font-medium mb-2">
            👥 মাঠ সহকারী নির্বাচন করুন
          </label>
          <Select
            isMulti
            options={faList}
            onChange={handleSelect}
            placeholder="একাধিক মাঠ সহকারী নির্বাচন করুন..."
            noOptionsMessage={() => "কোনো মাঠ সহকারী পাওয়া যায়নি"}
            isLoading={loading}
            loadingMessage={() => "লোড হচ্ছে..."}
            className="text-black"
            styles={{
              control: (base, state) => ({
                ...base,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: state.isFocused
                  ? "#facc15"
                  : "rgba(255, 255, 255, 0.15)",
                minHeight: "44px",
                boxShadow: state.isFocused
                  ? "0 0 0 2px rgba(250, 204, 21, 0.2)"
                  : "none",
                transition: "all 0.2s",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused
                  ? "rgba(59, 130, 246, 0.3)"
                  : "transparent",
                color: "white",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#3b82f6",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "white",
                fontWeight: "500",
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "white",
                ":hover": {
                  backgroundColor: "#2563eb",
                  color: "white",
                },
              }),
              placeholder: (base) => ({
                ...base,
                color: "rgba(255, 255, 255, 0.4)",
              }),
              input: (base) => ({
                ...base,
                color: "white",
              }),
            }}
          />

          {reports.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-white/60 text-sm">
                <span className="text-blue-400 font-semibold">
                  {reports.length}
                </span>{" "}
                জন মাঠ সহকারী নির্বাচিত
              </p>
              <button
                onClick={clearAll}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                🗑️ সব মুছুন
              </button>
            </div>
          )}
        </div>

        {/* ✅ FA Cards */}
        {reports.length > 0 ? (
          <div className="space-y-6 pb-32">
            {reports.map((r, i) => (
              <div
                key={r.fieldAssistantId}
                className="bg-white/8 border border-white/12 rounded-2xl p-5 backdrop-blur shadow-xl hover:bg-white/10 transition-all duration-300"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center text-white font-bold">
                      {r.fieldAssistantName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-white font-semibold text-base">
                        {r.fieldAssistantName}
                      </h2>
                      <p className="text-white/40 text-xs font-mono">
                        ID: {r.fieldAssistantId}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-1.5">
                      <span className="text-yellow-400/60 text-xs">
                        মোট সংগ্রহ:{" "}
                      </span>
                      <span className="text-yellow-400 font-bold">
                        ৳{r.totalCollection.toLocaleString("bn-BD")}
                      </span>
                    </div>
                    <div className="bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-1.5">
                      <span className="text-green-400/60 text-xs">
                        গ্র্যান্ড মোট:{" "}
                      </span>
                      <span className="text-green-400 font-bold">
                        ৳{r.grandTotal.toLocaleString("bn-BD")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 grid-cols-2 gap-3">
                  {[
                    { key: "newMember", label: "নতুন সদস্য", icon: "👤" },
                    { key: "dpsCount", label: "ডিপিএস সংখ্যা", icon: "📋" },
                    { key: "dpsAmount", label: "ডিপিএস টাকা", icon: "💰" },
                    { key: "collection", label: "সংগ্রহ", icon: "💵" },
                    { key: "runningLoan", label: "চলতি ঋণ", icon: "🔄" },
                    { key: "disburse", label: "ঋণ বিতরণ", icon: "📤" },
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-white/50 text-xs mb-1.5 font-medium flex items-center gap-1">
                        <span>{field.icon}</span>
                        {field.label}
                      </label>
                      <input
                        type="number"
                        value={r[field.key] === 0 ? "" : r[field.key]}
                        onChange={(e) =>
                          updateField(i, field.key, e.target.value)
                        }
                        onFocus={handleFocus}
                        onBlur={(e) => handleBlur(i, field.key, e)}
                        placeholder="0"
                        className="compactInput"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📊</span>
              </div>
              <p className="text-white/60 font-medium">
                কোনো মাঠ সহকারী নির্বাচিত নয়
              </p>
              <p className="text-white/40 text-sm mt-1">
                উপরের সিলেক্ট বক্স থেকে মাঠ সহকারী নির্বাচন করুন
              </p>
            </div>
          )
        )}

        {/* ✅ Sticky Bottom Bar */}
        {reports.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 border-t border-white/20 px-4 sm:px-6 py-4 backdrop-blur-lg shadow-2xl z-50">
            <div className="max-w-7xl mx-auto">
              {/* Mobile View */}
              <div className="block lg:hidden space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-2">
                    <p className="text-blue-400/60">নতুন সদস্য</p>
                    <p className="text-blue-400 font-bold">
                      {branchTotalNewMembers}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-2">
                    <p className="text-purple-400/60">ডিপিএস</p>
                    <p className="text-purple-400 font-bold">
                      {branchTotalDps}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-2">
                    <p className="text-yellow-400/60">মোট সংগ্রহ</p>
                    <p className="text-yellow-400 font-bold">
                      ৳{branchTotalCollection.toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-2">
                    <p className="text-red-400/60">বিতরণ</p>
                    <p className="text-red-400 font-bold">
                      ৳{branchTotalDisburse.toLocaleString("bn-BD")}
                    </p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-2 text-center">
                  <p className="text-green-400/60 text-xs">গ্র্যান্ড মোট</p>
                  <p className="text-green-400 font-bold text-lg">
                    ৳{branchGrandTotal.toLocaleString("bn-BD")}
                  </p>
                </div>
                <button
                  onClick={saveAll}
                  disabled={saveLoading}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {saveLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      সব রিপোর্ট সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>

              {/* Desktop View */}
              <div className="hidden lg:flex justify-between items-center">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-blue-400/60">নতুন সদস্য: </span>
                    <span className="text-blue-400 font-semibold">
                      {branchTotalNewMembers}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-400/60">ডিপিএস: </span>
                    <span className="text-purple-400 font-semibold">
                      {branchTotalDps}
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-400/60">মোট সংগ্রহ: </span>
                    <span className="text-yellow-400 font-semibold">
                      ৳{branchTotalCollection.toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-400/60">বিতরণ: </span>
                    <span className="text-red-400 font-semibold">
                      ৳{branchTotalDisburse.toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <div className="border-l border-white/20 pl-6">
                    <span className="text-green-400/60">গ্র্যান্ড মোট: </span>
                    <span className="text-green-400 font-bold text-lg">
                      ৳{branchGrandTotal.toLocaleString("bn-BD")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={saveAll}
                  disabled={saveLoading}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  {saveLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      সব রিপোর্ট সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Result Message */}
        {result && (
          <div
            className={`fixed top-6 right-6 max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-lg z-50 animate-fade-in ${
              result.success
                ? "bg-green-500/90 border border-green-400/40 text-white"
                : "bg-red-500/90 border border-red-400/40 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {result.success ? "✅" : "❌"}
              </span>
              <p className="font-medium">
                {result.success ? result.message : result.error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Compact Input Style */}
      <style jsx>{`
        .compactInput {
          height: 38px;
          padding: 6px 10px;
          font-size: 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          transition: all 0.2s;
        }

        .compactInput:focus {
          outline: none;
          border-color: #facc15;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.1);
        }

        .compactInput::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        /* Hide number input arrows */
        .compactInput::-webkit-outer-spin-button,
        .compactInput::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .compactInput[type="number"] {
          -moz-appearance: textfield;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}