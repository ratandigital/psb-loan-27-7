"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ViewDailyReportsPage() {
  const [reports, setReports] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  // Filters
  const [filterType, setFilterType] = useState("today");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit/Delete
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ✅ Safe Number Format Helper */
  function formatNumber(value) {
    const num = Number(value) || 0;
    return num.toLocaleString("bn-BD");
  }

  /* ✅ Get User Role */
  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) setUserRole(data.role);
      } catch (err) {
        console.error("Role fetch error:", err);
      }
    }
    fetchRole();
  }, []);

  /* ✅ Fetch Reports */
  useEffect(() => {
    fetchReports();
  }, [filterType, singleDate, startDate, endDate, page]);

  async function fetchReports() {
    setLoading(true);
    setError("");

    try {
      let url = `/api/daily-report?page=${page}`;

      if (filterType === "single" && singleDate) {
        url += `&date=${singleDate}`;
      } else if (filterType === "range" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setReports(data.reports || []);
        setTotals(data.totals || null);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || "ডাটা লোড করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      setError("ডাটা লোড করতে সমস্যা হয়েছে");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ✅ Show Toast */
  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ✅ Export to Excel */
  function exportToExcel() {
    if (reports.length === 0) {
      showToast("কোনো ডাটা নেই", "error");
      return;
    }

    try {
      // Prepare data
      const data = reports.map((r) => ({
        তারিখ: new Date(r.reportDate).toLocaleDateString("bn-BD"),
        "মাঠ সহকারী": r.fieldAssistantName,
        "নতুন সদস্য": r.newMember || 0,
        ডিপিএস: r.dpsCount || 0,
        "ডিপিএস টাকা": r.dpsAmount || 0,
        সংগ্রহ: r.collection || 0,
        "চলতি ঋণ": r.runningLoan || 0,
        বিতরণ: r.disburse || 0,
        "মোট সংগ্রহ": r.totalCollection || 0,
        "গ্র্যান্ড মোট": r.grandTotal || 0,
      }));

      // Add total row
      if (totals) {
        data.push({
          তারিখ: "",
          "মাঠ সহকারী": "সর্বমোট",
          "নতুন সদস্য": totals.newMember || 0,
          ডিপিএস: totals.dpsCount || 0,
          "ডিপিএস টাকা": totals.dpsAmount || 0,
          সংগ্রহ: totals.collection || 0,
          "চলতি ঋণ": totals.runningLoan || 0,
          বিতরণ: totals.disburse || 0,
          "মোট সংগ্রহ": totals.totalCollection || 0,
          "গ্র্যান্ড মোট": totals.grandTotal || 0,
        });
      }

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      ws["!cols"] = [
        { wch: 12 }, // তারিখ
        { wch: 20 }, // মাঠ সহকারী
        { wch: 12 }, // নতুন সদস্য
        { wch: 10 }, // ডিপিএস
        { wch: 12 }, // ডিপিএস টাকা
        { wch: 12 }, // সংগ্রহ
        { wch: 12 }, // চলতি ঋণ
        { wch: 12 }, // বিতরণ
        { wch: 14 }, // মোট সংগ্রহ
        { wch: 14 }, // গ্র্যান্ড মোট
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daily Report");

      // Generate filename
      const filename = `Daily_Report_${
        filterType === "today"
          ? new Date().toISOString().split("T")[0]
          : filterType === "single"
          ? singleDate
          : `${startDate}_to_${endDate}`
      }.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      showToast("✅ Excel ফাইল ডাউনলোড হয়েছে");
    } catch (err) {
      console.error("Excel export error:", err);
      showToast("Excel export করতে সমস্যা হয়েছে", "error");
    }
  }

  /* ✅ Export to PDF */
  function exportToPDF() {
    if (reports.length === 0) {
      showToast("কোনো ডাটা নেই", "error");
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text("Daily Branch Report", 14, 15);

      // Add date info
      doc.setFontSize(10);
      let dateText = "";
      if (filterType === "today") {
        dateText = `Date: ${new Date().toLocaleDateString("en-US")}`;
      } else if (filterType === "single") {
        dateText = `Date: ${new Date(singleDate).toLocaleDateString("en-US")}`;
      } else {
        dateText = `Period: ${new Date(startDate).toLocaleDateString(
          "en-US"
        )} to ${new Date(endDate).toLocaleDateString("en-US")}`;
      }
      doc.text(dateText, 14, 22);

      // Prepare table data
      const tableData = reports.map((r) => [
        new Date(r.reportDate).toLocaleDateString("en-US"),
        r.fieldAssistantName,
        r.newMember || 0,
        r.dpsCount || 0,
        r.totalCollection || 0,
        r.disburse || 0,
        r.grandTotal || 0,
      ]);

      // Add total row
      if (totals) {
        tableData.push([
          "",
          "TOTAL",
          totals.newMember || 0,
          totals.dpsCount || 0,
          totals.totalCollection || 0,
          totals.disburse || 0,
          totals.grandTotal || 0,
        ]);
      }

      // Add table
      doc.autoTable({
        startY: 28,
        head: [
          [
            "Date",
            "Field Assistant",
            "New Members",
            "DPS",
            "Collection",
            "Disburse",
            "Grand Total",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 30 },
        },
        didParseCell: function (data) {
          // Bold last row (total)
          if (totals && data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [220, 237, 250];
          }
        },
      });

      // Generate filename
      const filename = `Daily_Report_${
        filterType === "today"
          ? new Date().toISOString().split("T")[0]
          : filterType === "single"
          ? singleDate
          : `${startDate}_to_${endDate}`
      }.pdf`;

      // Download
      doc.save(filename);
      showToast("✅ PDF ফাইল ডাউনলোড হয়েছে");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("PDF export করতে সমস্যা হয়েছে", "error");
    }
  }

  /* ✅ Update Report */
  async function handleUpdate() {
    if (!editing) return;

    setActionLoading(true);

    try {
      const res = await fetch("/api/daily-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      const data = await res.json();

      if (data.success) {
        showToast("✅ রিপোর্ট আপডেট হয়েছে");
        setEditing(null);
        fetchReports();
      } else {
        showToast(data.error || "আপডেট করতে সমস্যা হয়েছে", "error");
      }
    } catch (err) {
      showToast("আপডেট করতে সমস্যা হয়েছে", "error");
      console.error("Update error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  /* ✅ Delete Report */
  async function handleDelete() {
    if (!deleteId) return;

    setActionLoading(true);

    try {
      const res = await fetch("/api/daily-report", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: deleteId }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("🗑️ রিপোর্ট ডিলিট হয়েছে");
        setDeleteId(null);
        fetchReports();
      } else {
        showToast(data.error || "ডিলিট করতে সমস্যা হয়েছে", "error");
      }
    } catch (err) {
      showToast("ডিলিট করতে সমস্যা হয়েছে", "error");
      console.error("Delete error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  /* ✅ Edit Handler */
  function openEdit(report) {
    setEditing({
      ...report,
      newMember: report.newMember || 0,
      dpsCount: report.dpsCount || 0,
      dpsAmount: report.dpsAmount || 0,
      collection: report.collection || 0,
      runningLoan: report.runningLoan || 0,
      disburse: report.disburse || 0,
    });
  }

  function updateEditField(field, value) {
    setEditing((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  }

  const canManage = userRole === "Branch Manager" || userRole === "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-lg z-50 animate-fade-in ${
            toast.type === "error"
              ? "bg-red-500/90 border border-red-400/40 text-white"
              : "bg-green-500/90 border border-green-400/40 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/30 border border-blue-400/40 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  দৈনিক রিপোর্ট দেখুন
                </h1>
                <p className="text-white/40 text-sm mt-0.5">
                  সংরক্ষিত রিপোর্ট দেখুন এবং পরিচালনা করুন
                </p>
              </div>
            </div>

            {/* ✅ Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={reports.length === 0}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to Excel"
              >
                <span className="text-lg">📊</span>
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={reports.length === 0}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to PDF"
              >
                <span className="text-lg">📄</span>
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/8 border border-white/12 rounded-2xl p-5 mb-6 shadow-xl">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🔍</span>
            ফিল্টার করুন
          </h2>

          {/* Filter Type Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => {
                setFilterType("today");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === "today"
                  ? "bg-yellow-400 text-blue-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📅 আজকের
            </button>
            <button
              onClick={() => {
                setFilterType("single");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === "single"
                  ? "bg-yellow-400 text-blue-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📆 নির্দিষ্ট তারিখ
            </button>
            <button
              onClick={() => {
                setFilterType("range");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === "range"
                  ? "bg-yellow-400 text-blue-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📊 তারিখ রেঞ্জ
            </button>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filterType === "single" && (
              <div>
                <label className="block text-white/60 text-sm mb-1.5">
                  তারিখ নির্বাচন করুন
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    setSingleDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}

            {filterType === "range" && (
              <>
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">
                    শেষ তারিখ
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 border border-red-400/30 text-red-300 px-5 py-4 rounded-xl mb-6 flex items-center gap-3">
            <span className="text-xl">❌</span>
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white/8 border border-white/12 rounded-2xl overflow-hidden shadow-xl mb-6">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-white/60 text-sm">
              {loading ? "লোড হচ্ছে..." : `${reports.length} টি রিপোর্ট`}
            </p>
            {reports.length > 0 && (
              <p className="text-white/40 text-xs">
                পৃষ্ঠা {page} / {totalPages}
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-20 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-white/60">কোনো রিপোর্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/8">
                      {[
                        "তারিখ",
                        "মাঠ সহকারী",
                        "নতুন সদস্য",
                        "ডিপিএস",
                        "সংগ্রহ",
                        "বিতরণ",
                        "গ্র্যান্ড মোট",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-white/40 font-semibold text-xs uppercase whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                      {canManage && (
                        <th className="px-4 py-3 text-center text-white/40 font-semibold text-xs uppercase">
                          অ্যাকশন
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, idx) => (
                      <tr
                        key={r._id}
                        className={`border-t border-white/8 hover:bg-white/5 transition-colors ${
                          idx % 2 !== 0 ? "bg-white/3" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                          {new Date(r.reportDate).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-4 py-3 text-white whitespace-nowrap">
                          {r.fieldAssistantName}
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          {formatNumber(r.newMember)}
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          {formatNumber(r.dpsCount)}
                        </td>
                        <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                          ৳{formatNumber(r.totalCollection)}
                        </td>
                        <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                          ৳{formatNumber(r.disburse)}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold whitespace-nowrap">
                          ৳{formatNumber(r.grandTotal)}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(r)}
                                className="bg-yellow-400/15 hover:bg-yellow-400/30 border border-yellow-400/25 text-yellow-300 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                title="এডিট"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setDeleteId(r._id)}
                                className="bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 text-red-300 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                title="ডিলিট"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Total Row */}
                    {totals && (
                      <tr className="bg-blue-500/10 border-t-2 border-blue-400/30 font-semibold">
                        <td
                          colSpan="2"
                          className="px-4 py-4 text-white uppercase tracking-wider"
                        >
                          📊 সর্বমোট
                        </td>
                        <td className="px-4 py-4 text-blue-300">
                          {formatNumber(totals.newMember)}
                        </td>
                        <td className="px-4 py-4 text-blue-300">
                          {formatNumber(totals.dpsCount)}
                        </td>
                        <td className="px-4 py-4 text-yellow-400 whitespace-nowrap">
                          ৳{formatNumber(totals.totalCollection)}
                        </td>
                        <td className="px-4 py-4 text-red-400 whitespace-nowrap">
                          ৳{formatNumber(totals.disburse)}
                        </td>
                        <td className="px-4 py-4 text-green-400 text-lg whitespace-nowrap">
                          ৳{formatNumber(totals.grandTotal)}
                        </td>
                        {canManage && <td></td>}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-white/8">
                {reports.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 hover:bg-white/4 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">
                          {r.fieldAssistantName}
                        </p>
                        <p className="text-white/40 text-xs">
                          {new Date(r.reportDate).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          ৳{formatNumber(r.grandTotal)}
                        </p>
                        <p className="text-white/40 text-xs">গ্র্যান্ড মোট</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 mb-0.5">নতুন সদস্য</p>
                        <p className="text-white font-semibold">
                          {formatNumber(r.newMember)}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 mb-0.5">ডিপিএস</p>
                        <p className="text-white font-semibold">
                          {formatNumber(r.dpsCount)}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 mb-0.5">সংগ্রহ</p>
                        <p className="text-white font-semibold">
                          ৳{formatNumber(r.totalCollection)}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/40 mb-0.5">বিতরণ</p>
                        <p className="text-white font-semibold">
                          ৳{formatNumber(r.disburse)}
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/8">
                        <button
                          onClick={() => openEdit(r)}
                          className="flex-1 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/25 text-yellow-300 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                          ✏️ এডিট
                        </button>
                        <button
                          onClick={() => setDeleteId(r._id)}
                          className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                          🗑️ ডিলিট
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Mobile Total Card */}
                {totals && (
                  <div className="p-4 bg-blue-500/10 border-t-2 border-blue-400/30">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <span>📊</span>
                      সর্বমোট
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-blue-300/60 mb-0.5">নতুন সদস্য</p>
                        <p className="text-blue-300 font-bold">
                          {formatNumber(totals.newMember)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-blue-300/60 mb-0.5">ডিপিএস</p>
                        <p className="text-blue-300 font-bold">
                          {formatNumber(totals.dpsCount)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-yellow-400/60 mb-0.5">মোট সংগ্রহ</p>
                        <p className="text-yellow-400 font-bold">
                          ৳{formatNumber(totals.totalCollection)}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-red-400/60 mb-0.5">বিতরণ</p>
                        <p className="text-red-400 font-bold">
                          ৳{formatNumber(totals.disburse)}
                        </p>
                      </div>
                      <div className="col-span-2 bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                        <p className="text-green-400/60 mb-1 text-center">
                          গ্র্যান্ড মোট
                        </p>
                        <p className="text-green-400 font-bold text-lg text-center">
                          ৳{formatNumber(totals.grandTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/12 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
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
                        ? "bg-yellow-400 text-blue-900"
                        : "bg-white/8 hover:bg-white/15 text-white"
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
              className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/12 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              পরে →
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/98 border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-white font-bold">রিপোর্ট এডিট করুন</h2>
                <p className="text-white/40 text-xs mt-1">
                  {editing.fieldAssistantName}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "newMember", label: "নতুন সদস্য", icon: "👤" },
                  { key: "dpsCount", label: "ডিপিএস সংখ্যা", icon: "📋" },
                  { key: "dpsAmount", label: "ডিপিএস টাকা", icon: "💰" },
                  { key: "collection", label: "সংগ্রহ", icon: "💵" },
                  { key: "runningLoan", label: "চলতি ঋণ", icon: "🔄" },
                  { key: "disburse", label: "ঋণ বিতরণ", icon: "📤" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-white/60 text-sm mb-1.5 flex items-center gap-1.5">
                      <span>{field.icon}</span>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={editing[field.key]}
                      onChange={(e) =>
                        updateEditField(field.key, e.target.value)
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = "";
                      }}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                    <p className="text-yellow-400/60 text-xs mb-1">
                      মোট সংগ্রহ
                    </p>
                    <p className="text-yellow-400 font-bold">
                      ৳
                      {formatNumber(
                        (Number(editing.dpsAmount) || 0) +
                          (Number(editing.collection) || 0) +
                          (Number(editing.runningLoan) || 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3">
                    <p className="text-green-400/60 text-xs mb-1">
                      গ্র্যান্ড মোট
                    </p>
                    <p className="text-green-400 font-bold">
                      ৳
                      {formatNumber(
                        (Number(editing.dpsAmount) || 0) +
                          (Number(editing.collection) || 0) +
                          (Number(editing.runningLoan) || 0) -
                          (Number(editing.disburse) || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/15 rounded-xl text-sm font-medium text-white transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    আপডেট হচ্ছে...
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    আপডেট করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/98 border border-white/15 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-white font-bold text-lg mb-2">
                নিশ্চিত করুন
              </h3>
              <p className="text-white/60 text-sm">
                এই রিপোর্টটি স্থায়ীভাবে মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/15 rounded-xl text-sm font-medium text-white transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ডিলিট হচ্ছে...
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    ডিলিট করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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