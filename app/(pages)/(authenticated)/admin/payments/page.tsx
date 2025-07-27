"use client";
import { useState, useEffect, SetStateAction } from "react";
import {
  Bell,
  Users,
  BarChart2,
  Calendar,
  AlertCircle,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Search,
  Download,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import moment from "moment";

export default function PaymentsAdminPanel() {
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("MMMM YYYY")
  );
  type PaymentRecord = {
    id: string;
    studentId: string;
    studentName: string;
    roomNo: string;
    date: string;
    mealCount: number;
    amount: string;
    status: string;
  };

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    totalStudents: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    collectedAmount: "₹0",
    pendingAmount: "₹0",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to fetch monthly revenue data
  const fetchMonthlyRevenue = async () => {
    try {
      setLoading(true);
      setError("");

      // Make API call to get monthly revenue
      const response = await axios.get("/api/admin/stats/revenue/month");

      if (response.data) {
        const monthlyRevenue = response.data.monthlyRevenue || 0;

        // For demo purposes, let's calculate some mock stats based on the revenue
        const mockTotalStudents = Math.floor(monthlyRevenue / 3000) + 20; // Assume average fee of 3000 per student
        const mockPaidCount = Math.floor(mockTotalStudents * 0.7); // 70% have paid
        const mockPartialCount = Math.floor(mockTotalStudents * 0.2); // 20% have partially paid
        const mockUnpaidCount =
          mockTotalStudents - mockPaidCount - mockPartialCount; // Rest are unpaid

        // Update stats
        setPaymentStats({
          totalStudents: mockTotalStudents,
          paidCount: mockPaidCount,
          partialCount: mockPartialCount,
          unpaidCount: mockUnpaidCount,
          collectedAmount: formatCurrency(monthlyRevenue),
          pendingAmount: formatCurrency(
            Math.round(mockTotalStudents * 3000 - monthlyRevenue)
          ),
        });

        // Generate mock payment records for UI display
        const mockRecords = Array.from({ length: 10 }, (_, i) => ({
          id: `STU${1000 + i}`,
          studentId: `STU${1000 + i}`,
          studentName: `Student ${i + 1}`,
          roomNo: `${100 + Math.floor(i / 2)}${String.fromCharCode(
            65 + (i % 2)
          )}`,
          date: formatDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000)),
          mealCount: 30 - Math.floor(Math.random() * 5),
          amount: formatCurrency(3000 - (i % 3) * 500),
          status: i < 7 ? "Paid" : i < 9 ? "Partial" : "Unpaid",
        }));

        setPaymentRecords(mockRecords);
      }
    } catch (err) {
      console.error("Error fetching monthly revenue:", err);
      setError("Failed to load revenue data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Format date function
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${month} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchMonthlyRevenue();
  }, []);

  // Handle month change - since our API doesn't support passing month parameter yet,
  // this will just show the same data regardless of selected month
  const handleMonthChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedMonth(e.target.value);
    // In a real implementation, you would pass the selected month to the API
    fetchMonthlyRevenue();
  };

  // Filter records based on search query and status
  const filteredRecords = paymentRecords.filter((record) => {
    const matchesSearch =
      record.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold">Payments Management</h2>
            <div className="flex items-center">
              {/* Add any header content here */}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p>{error}</p>
              <button
                onClick={() => fetchMonthlyRevenue()}
                className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Collection Status
                      </p>
                      <h3 className="text-2xl font-semibold mb-4">
                        {selectedMonth}
                      </h3>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Paid</span>
                    <span className="font-medium text-green-600">
                      {paymentStats.paidCount} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          paymentStats.totalStudents
                            ? (paymentStats.paidCount /
                                paymentStats.totalStudents) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Partial</span>
                    <span className="font-medium text-yellow-600">
                      {paymentStats.partialCount} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${
                          paymentStats.totalStudents
                            ? (paymentStats.partialCount /
                                paymentStats.totalStudents) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Unpaid</span>
                    <span className="font-medium text-red-600">
                      {paymentStats.unpaidCount} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${
                          paymentStats.totalStudents
                            ? (paymentStats.unpaidCount /
                                paymentStats.totalStudents) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Rest of your existing payment stats UI */}
                {/* ... */}
              </div>

              {/* Payment Records */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Payment Records</h3>

                    <div className="flex space-x-3">
                      <button className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Add Payment</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-gray-200 flex flex-wrap gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by student name or ID..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <div className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                      >
                        <option>May 2025</option>
                        <option>April 2025</option>
                        <option>March 2025</option>
                        <option>February 2025</option>
                        <option>January 2025</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    </div>

                    <div className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option>All</option>
                        <option>Paid</option>
                        <option>Partial</option>
                        <option>Unpaid</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    </div>

                    <button className="flex items-center px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                      <Download className="w-4 h-4 mr-2" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Table section */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meals Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {record.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {record.studentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {record.roomNo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {record.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {record.mealCount} meals
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {record.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  record.status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "Partial"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <div className="flex justify-end space-x-3">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-800">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {searchQuery || statusFilter !== "All"
                              ? "No payment records match your search criteria"
                              : "No payment records available for this month"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {filteredRecords.length} of{" "}
                    {paymentStats.totalStudents} records
                  </p>

                  {filteredRecords.length > 0 && (
                    <div className="flex space-x-1">
                      <button
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        disabled
                      >
                        Previous
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                        1
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        2
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        3
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        ...
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
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
