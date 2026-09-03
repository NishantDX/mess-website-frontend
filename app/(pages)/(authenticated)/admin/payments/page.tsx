"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Download, ChevronDown, DollarSign, RefreshCw } from "lucide-react";
import axios from "axios";

type Status = "Paid" | "Partial" | "Unpaid";

type Rec = {
  student_id: string;
  name: string;
  department: string;
  meals: number;
  owed: number;
  paid: number;
  status: Status;
};

type Stats = {
  totalStudents: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  collected: number;
  pending: number;
};

const PAGE_SIZE = 10;
const EMPTY_STATS: Stats = {
  totalStudents: 0,
  paidCount: 0,
  partialCount: 0,
  unpaidCount: 0,
  collected: 0,
  pending: 0,
};

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PaymentsAdminPanel() {
  const [records, setRecords] = useState<Rec[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/payments/summary");
      setRecords(Array.isArray(res.data?.records) ? res.data.records : []);
      setStats(res.data?.stats ?? EMPTY_STATS);
    } catch (err) {
      console.error("Error fetching payment summary:", err);
      setError("Failed to load payment data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.student_id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const pct = (n: number) =>
    stats.totalStudents ? (n / stats.totalStudents) * 100 : 0;

  const exportCsv = () => {
    const header = ["Student ID", "Name", "Department", "Meals", "Owed", "Paid", "Status"];
    const body = filtered.map((r) => [
      r.student_id,
      r.name,
      r.department,
      r.meals,
      r.owed,
      r.paid,
      r.status,
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusClasses = (s: Status) =>
    s === "Paid"
      ? "bg-green-100 text-green-800"
      : s === "Partial"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold">Payments Management</h2>
            <button
              onClick={fetchData}
              className="flex items-center px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p>{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Collection status */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Collection Status</p>
                      <h3 className="text-2xl font-semibold">
                        {stats.totalStudents} students
                      </h3>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  {(
                    [
                      ["Paid", stats.paidCount, "bg-green-500", "text-green-600"],
                      ["Partial", stats.partialCount, "bg-yellow-500", "text-yellow-600"],
                      ["Unpaid", stats.unpaidCount, "bg-red-500", "text-red-600"],
                    ] as const
                  ).map(([label, count, bar, text]) => (
                    <div key={label} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className={`font-medium ${text}`}>{count} students</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div
                          className={`${bar} h-2 rounded-full`}
                          style={{ width: `${pct(count)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collected */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-gray-500 mb-1">Collected</p>
                  <h3 className="text-3xl font-semibold text-green-600">
                    {inr(stats.collected)}
                  </h3>
                  <p className="mt-2 text-xs text-gray-500">
                    From {stats.paidCount + stats.partialCount} paying students
                  </p>
                </div>

                {/* Pending */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-gray-500 mb-1">Pending</p>
                  <h3 className="text-3xl font-semibold text-red-600">
                    {inr(stats.pending)}
                  </h3>
                  <p className="mt-2 text-xs text-gray-500">
                    Across {stats.partialCount + stats.unpaidCount} students
                  </p>
                </div>
              </div>

              {/* Records */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Payment Records</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search name or ID…"
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as "All" | Status)
                        }
                      >
                        <option value="All">All statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <button
                      onClick={exportCsv}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {["Student ID", "Name", "Department", "Meals", "Owed", "Paid", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pageRows.length > 0 ? (
                        pageRows.map((r) => (
                          <tr key={r.student_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{r.student_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{r.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{r.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{r.meals}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{inr(r.owed)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{inr(r.paid)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses(
                                  r.status
                                )}`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            {searchQuery || statusFilter !== "All"
                              ? "No records match your filters"
                              : "No payment records available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">
                    {filtered.length === 0
                      ? "0 records"
                      : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(
                          current * PAGE_SIZE,
                          filtered.length
                        )} of ${filtered.length}`}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={current === 1}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (n) =>
                            n === 1 ||
                            n === totalPages ||
                            Math.abs(n - current) <= 1
                        )
                        .map((n, idx, arr) => (
                          <span key={n} className="flex items-center">
                            {idx > 0 && n - arr[idx - 1] > 1 && (
                              <span className="px-2 text-gray-400">…</span>
                            )}
                            <button
                              onClick={() => setPage(n)}
                              className={`px-3 py-1 rounded-md text-sm border ${
                                n === current
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {n}
                            </button>
                          </span>
                        ))}
                      <button
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={current === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
