"use client";

import { useEffect, useState, useCallback } from "react";

export default function TomorrowAlertPage() {
  const [data, setData] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendingIndex, setSendingIndex] = useState(null);
  const [sentMap, setSentMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("outstanding"); // outstanding, name, count

  // ✅ Load data with filters
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        let url = "/api/loan/tomorrow-alert";

        if (from && to) {
          url += `?from=${from}&to=${to}`;
        }

        const res = await fetch(url, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!ignore) {
          if (json.success) {
            setData(json.data || []);
          } else {
            setError("ডেটা পাওয়া যায়নি");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError("সার্ভার সমস্যা হয়েছে");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [from, to]);

  // ✅ Filter and sort data
  const filteredData = useCallback(() => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      result = result.filter((fa) =>
        fa.fieldAssistant
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "outstanding":
        result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
        break;
      case "name":
        result.sort((a, b) =>
          a.fieldAssistant.localeCompare(b.fieldAssistant)
        );
        break;
      case "count":
        result.sort((a, b) => b.totalLoan - a.totalLoan);
        break;
      default:
        break;
    }

    return result;
  }, [data, searchTerm, sortBy]);

  const displayData = filteredData();

  // ✅ Handle send email
  const handleSendEmail = async (index, fa) => {
    try {
      setSendingIndex(index);

      const res = await fetch("/api/loan/send-alert-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldAssistant: fa.fieldAssistant,
          loans: fa.details,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSentMap((prev) => ({
          ...prev,
          [index]: true,
        }));
      } else {
        alert("ইমেইল পাঠানো যায়নি");
      }
    } catch (err) {
      alert("সার্ভার সমস্যা হয়েছে");
    } finally {
      setSendingIndex(null);
    }
  };

  // ✅ Reset filters
  const handleReset = () => {
    setFrom("");
    setTo("");
    setSearchTerm("");
    setSortBy("outstanding");
    setOpenIndex(null);
  };

  // ✅ Get stats
  const totalAssistants = data.length;
  const totalLoans = data.reduce((sum, fa) => sum + fa.totalLoan, 0);
  const totalOutstanding = data.reduce(
    (sum, fa) => sum + fa.totalOutstanding,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ========== HEADER ========== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-red-500 flex items-center gap-2">
                <span>⚠️</span>
                <span>খেলাপি এলার্ট তালিকা</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                আগামীকাল বকেয়া হওয়ার ঋণ সমূহ
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-blue-400 text-xs sm:text-sm font-semibold">
                  ফিল্ড অ্যাসিস্ট্যান্ট
                </p>
                <p className="text-blue-200 text-xl sm:text-2xl font-bold">
                  {totalAssistants}
                </p>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-yellow-400 text-xs sm:text-sm font-semibold">
                  মোট ঋণ
                </p>
                <p className="text-yellow-200 text-xl sm:text-2xl font-bold">
                  {totalLoans}
                </p>
              </div>
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-red-400 text-xs sm:text-sm font-semibold">
                  মোট বকেয়া
                </p>
                <p className="text-red-200 text-xl sm:text-2xl font-bold">
                  ৳ {(totalOutstanding / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== FILTER SECTION ========== */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6 mb-6 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>🔍</span>
            <span>ফিল্টার এবং সাজান</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* From Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                শুরু তারিখ
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                শেষ তারিখ
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                খুঁজুন
              </label>
              <input
                type="text"
                placeholder="নাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                সাজান
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="outstanding">সর্বোচ্চ বকেয়া</option>
                <option value="count">সর্বোচ্চ ঋণ</option>
                <option value="name">নাম অনুযায়ী</option>
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                &nbsp;
              </label>
              <button
                onClick={handleReset}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                🔄 রিসেট
              </button>
            </div>
          </div>
        </div>

        {/* ========== LOADING STATE ========== */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">লোড হচ্ছে...</p>
            </div>
          </div>
        )}

        {/* ========== ERROR STATE ========== */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* ========== NO DATA STATE ========== */}
        {!loading && !error && displayData.length === 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center">
            <p className="text-green-400 font-semibold text-lg">
              ✅ কোনো খেলাপি এলার্ট নেই
            </p>
          </div>
        )}

        {/* ========== DATA CARDS ========== */}
        <div className="space-y-4">
          {displayData.map((fa, index) => (
            <div
              key={index}
              className="border border-gray-700/50 rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:border-gray-600/50 transition"
            >
              {/* Summary Header */}
              <div
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="cursor-pointer bg-gray-800/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-gray-800 transition"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg text-white flex items-center gap-2">
                    <span>👤</span>
                    <span className="truncate">{fa.fieldAssistant}</span>
                  </h2>
                  <div className="text-sm text-gray-300 mt-2 grid grid-cols-2 gap-2 sm:flex sm:gap-4">
                    <div>
                      <span className="text-gray-400">মোট ঋণ:</span>
                      <span className="font-semibold text-yellow-400 ml-1">
                        {fa.totalLoan}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">মোট বকেয়া:</span>
                      <span className="font-semibold text-red-400 ml-1">
                        ৳ {fa.totalOutstanding.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Send Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendEmail(index, fa);
                    }}
                    disabled={sendingIndex === index}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                      sendingIndex === index
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : sentMap[index]
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {sendingIndex === index ? (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                        পাঠাচ্ছে...
                      </span>
                    ) : sentMap[index] ? (
                      "✓ পুনরায় পাঠান"
                    ) : (
                      "📧 পাঠান"
                    )}
                  </button>

                  {/* Chevron */}
                  <span className="text-xl text-gray-400">
                    {openIndex === index ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Details Table */}
              {openIndex === index && (
                <div className="border-t border-gray-700/50 p-4 sm:p-5 overflow-x-auto">
                  <div className="text-gray-300 text-sm mb-3 font-semibold">
                    📋 ঋণের বিবরণ ({fa.details.length} টি)
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-300">
                            ইউনিয়ন
                          </th>
                          <th className="px-3 py-2 text-left text-gray-300">
                            সমিতি
                          </th>
                          <th className="px-3 py-2 text-left text-gray-300">
                            সদস্য
                          </th>
                          <th className="px-3 py-2 text-center text-gray-300">
                            বিতরণ তারিখ
                          </th>
                          <th className="px-3 py-2 text-center text-gray-300">
                            বকেয়া তারিখ
                          </th>
                          <th className="px-3 py-2 text-right text-gray-300">
                            পরিমাণ
                          </th>
                          <th className="px-3 py-2 text-right text-gray-300">
                            বকেয়া
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {fa.details.map((loan, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-700/20 transition"
                          >
                            <td className="px-3 py-2 text-gray-200">
                              {loan.unionName}
                            </td>
                            <td className="px-3 py-2 text-gray-200">
                              {loan.samiteeName}
                            </td>
                            <td className="px-3 py-2 text-gray-200">
                              {loan.memberOrCustomer}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-300">
                              {new Date(
                                loan.disburseDate
                              ).toLocaleDateString("bn-BD")}
                            </td>
                            <td className="px-3 py-2 text-center text-red-400 font-semibold">
                              {new Date(
                                loan.overdueDate
                              ).toLocaleDateString("bn-BD")}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-200">
                              ৳ {loan.disburseAmount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right text-red-400 font-semibold">
                              ৳{" "}
                              {loan.principalOutstandingUptoPreMonth.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="sm:hidden space-y-3">
                    {fa.details.map((loan, i) => (
                      <div
                        key={i}
                        className="bg-gray-700/30 rounded-lg p-3 space-y-2 border border-gray-600/30"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">সদস্য</span>
                          <span className="text-white font-semibold">
                            {loan.memberOrCustomer}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">ইউনিয়ন</span>
                          <span className="text-gray-200 text-sm">
                            {loan.unionName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">সমিতি</span>
                          <span className="text-gray-200 text-sm">
                            {loan.samiteeName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">
                            বিতরণ
                          </span>
                          <span className="text-gray-200 text-sm">
                            {new Date(
                              loan.disburseDate
                            ).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-600/30 pt-2">
                          <span className="text-gray-400 text-xs">
                            বকেয়া তারিখ
                          </span>
                          <span className="text-red-400 font-semibold">
                            {new Date(
                              loan.overdueDate
                            ).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">
                            পরিমাণ
                          </span>
                          <span className="text-gray-200 font-semibold">
                            ৳ {loan.disburseAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between bg-red-900/20 -mx-3 -mb-3 px-3 py-2 rounded-b border-t border-red-600/30">
                          <span className="text-red-400 text-xs">বকেয়া</span>
                          <span className="text-red-400 font-bold">
                            ৳{" "}
                            {loan.principalOutstandingUptoPreMonth.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}