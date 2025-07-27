"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import axios from "axios";
import { useAuth } from "../../store/authStore";

// Define the attendance record type based on your API response
interface AttendanceRecord {
  _id: string;
  student_id: string;
  date: string; // Year-Month-Date format
  attendance: "breakfast" | "lunch" | "dinner";
}

export default function MealHistory() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM")); // Current month as default
  const [mealType, setMealType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recordsPerPage = 7;

  // State for marking attendance
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [markingError, setMarkingError] = useState<string | null>(null);
  const [markingSuccess, setMarkingSuccess] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<
    "breakfast" | "lunch" | "dinner"
  >("breakfast");

  const { user } = useAuth();
  const studentId = user?.student_id;

  // Fetch attendance data when component mounts or when studentId changes
  useEffect(() => {
    fetchAttendanceData();
  }, [studentId]);

  const fetchAttendanceData = async () => {
    if (!studentId) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/attendance/${studentId}`);

      // Ensure we have an array
      let records = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (
        response.data &&
        response.data.records &&
        Array.isArray(response.data.records)
      ) {
        records = response.data.records;
      } else if (typeof response.data === "string") {
        try {
          const parsed = JSON.parse(response.data);
          records = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Failed to parse response data:", e);
        }
      }

      setAttendanceData(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError("Failed to load attendance data. Please try again.");
      setAttendanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle marking attendance
  // Update the handleMarkAttendance function to use the correct endpoint
  const handleMarkAttendance = async () => {
    if (!studentId) {
      setMarkingError("Student information not available");
      return;
    }

    setIsMarkingAttendance(true);
    setMarkingError(null);
    setMarkingSuccess(null);

    try {
      // Get current date in ISO format (YYYY-MM-DD)
      const today = new Date();
      const dateString = format(today, "yyyy-MM-dd");

      // Check if already marked attendance for this meal today
      const alreadyMarked = attendanceData.some(
        (record) =>
          record.date.startsWith(dateString) &&
          record.attendance === selectedMeal
      );

      if (alreadyMarked) {
        setMarkingError(
          `You have already marked your ${selectedMeal} attendance for today`
        );
        setIsMarkingAttendance(false);
        return;
      }

      // Make API call to mark attendance using the /api/attendance endpoint
      const response = await axios.post("/api/attendance", {
        student_id: studentId,
        attendance: selectedMeal,
        date: dateString,
      });

      // Show success notification with animation
      setMarkingSuccess(`✓ Attendance marked successfully for ${selectedMeal}`);

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Attendance Marked", {
          body: `Your attendance for ${selectedMeal} has been recorded.`,
          icon: "/favicon.ico",
        });
      }

      // Refresh attendance data
      fetchAttendanceData();
    } catch (err: any) {
      console.error("Error marking attendance:", err);
      setMarkingError(
        err.response?.data?.message ||
          "Failed to mark attendance. Please try again."
      );
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Extract unique months from data for the dropdown
  const getAvailableMonths = () => {
    const uniqueMonths = new Set<string>();

    // Check if attendanceData is an array and not empty
    if (Array.isArray(attendanceData) && attendanceData.length > 0) {
      attendanceData.forEach((record) => {
        if (record && record.date && typeof record.date === "string") {
          // Extract yyyy-MM from the date
          const monthYear = record.date.substring(0, 7);
          uniqueMonths.add(monthYear);
        }
      });
    }

    // Convert to array and sort descending (newest first)
    return Array.from(uniqueMonths)
      .sort()
      .reverse()
      .map((monthYear) => {
        const [year, monthNum] = monthYear.split("-");
        const monthName = new Date(
          parseInt(year),
          parseInt(monthNum) - 1
        ).toLocaleString("default", { month: "long" });
        return {
          value: monthYear,
          label: `${monthName} ${year}`,
        };
      });
  };

  const availableMonths = getAvailableMonths();

  // If no months are available from data, provide current month as fallback
  if (availableMonths.length === 0) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based
    const monthName = currentDate.toLocaleString("default", { month: "long" });

    availableMonths.push({
      value: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
      label: `${monthName} ${currentYear}`,
    });
  }

  // Filter the data based on selected filters
  const filteredData = Array.isArray(attendanceData)
    ? attendanceData.filter((record) => {
        const monthMatch = record.date.startsWith(month);
        const mealMatch = mealType === "all" || record.attendance === mealType;
        return monthMatch && mealMatch;
      })
    : [];

  // Sort by date (descending) and then by meal type
  const sortedData = [...filteredData].sort((a, b) => {
    // First sort by date (descending)
    const dateComparison =
      new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComparison !== 0) return dateComparison;

    // Then sort by meal type using a consistent order
    const mealOrder: Record<string, number> = {
      breakfast: 1,
      lunch: 2,
      dinner: 3,
    };
    return mealOrder[a.attendance] - mealOrder[b.attendance];
  });

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  // Format date to display in a friendly format
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEE, MMM d, yyyy"); // e.g., "Mon, Feb 2, 2025"
    } catch (error) {
      return dateString;
    }
  };

  // Format just the day name
  const formatDayName = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEEE"); // e.g., "Monday"
    } catch (error) {
      return "Unknown";
    }
  };

  // Calculate monthly statistics
  const calculateMonthlyStats = () => {
    const currentMonth = month;
    const monthData = attendanceData.filter((record) =>
      record.date.startsWith(currentMonth)
    );

    // Get actual days in the selected month
    let daysInMonth = 30; // default
    if (currentMonth) {
      const [year, monthStr] = currentMonth.split("-");
      if (year && monthStr) {
        // Using the right calculation for days in month
        // Note: we need to use the next month and day 0 to get last day of current month
        const lastDay = new Date(
          parseInt(year),
          parseInt(monthStr),
          0
        ).getDate();
        daysInMonth = lastDay;
      }
    }

    // Count attendance for each meal type
    const breakfastCount = monthData.filter(
      (record) => record.attendance === "breakfast"
    ).length;
    const lunchCount = monthData.filter(
      (record) => record.attendance === "lunch"
    ).length;
    const dinnerCount = monthData.filter(
      (record) => record.attendance === "dinner"
    ).length;

    return {
      breakfast: {
        count: breakfastCount,
        percentage: Math.round((breakfastCount / daysInMonth) * 100),
      },
      lunch: {
        count: lunchCount,
        percentage: Math.round((lunchCount / daysInMonth) * 100),
      },
      dinner: {
        count: dinnerCount,
        percentage: Math.round((dinnerCount / daysInMonth) * 100),
      },
    };
  };

  const stats = calculateMonthlyStats();

  // Determine if attendance marking should be disabled based on time of day
  // Determine if attendance marking should be disabled based on time of day
  const getAttendanceStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Define meal time ranges in minutes for easier comparison
    const breakfastRange = {
      start: 8 * 60, // 8:00 AM
      end: 9 * 60 + 30, // 9:30 AM
    };

    const lunchRange = {
      start: 12 * 60 + 30, // 12:30 PM
      end: 14 * 60, // 2:00 PM
    };

    // For dinner that spans overnight to 9:30 AM
    const dinnerRange = {
      start: 20 * 60, // 8:00 PM
      end: 21 * 60 + 30, // 9:30 PM
    };
    // Special check for dinner since it spans across midnight
    const isDinnerTime = 
    currentTimeInMinutes >= dinnerRange.start && 
    currentTimeInMinutes <= dinnerRange.end;

  const isBreakfastTime =
    currentTimeInMinutes >= breakfastRange.start &&
    currentTimeInMinutes <= breakfastRange.end;

  const isLunchTime =
    currentTimeInMinutes >= lunchRange.start &&
    currentTimeInMinutes <= lunchRange.end;

    return {
      isBreakfastTime,
      isLunchTime,
      isDinnerTime,
      // Enable marking if it's within any meal time
      canMarkAttendance: isBreakfastTime || isLunchTime || isDinnerTime,
      // Suggested meal based on current time
      suggestedMeal: isBreakfastTime
        ? "breakfast"
        : isLunchTime
        ? "lunch"
        : isDinnerTime
        ? "dinner"
        : "breakfast",
    };
  };

  const attendanceStatus = getAttendanceStatus();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Meal History</h1>
      </div>

      {/* New Attendance Marking Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mark Attendance</h2>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="font-medium">Select Meal:</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedMeal("breakfast")}
                className={`px-4 py-2 rounded-md ${
                  selectedMeal === "breakfast"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${
                  attendanceStatus.isBreakfastTime
                    ? "border-2 border-green-400"
                    : ""
                }`}
              >
                Breakfast
                {attendanceStatus.isBreakfastTime && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Now
                  </span>
                )}
              </button>

              <button
                onClick={() => setSelectedMeal("lunch")}
                className={`px-4 py-2 rounded-md ${
                  selectedMeal === "lunch"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${
                  attendanceStatus.isLunchTime
                    ? "border-2 border-green-400"
                    : ""
                }`}
              >
                Lunch
                {attendanceStatus.isLunchTime && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Now
                  </span>
                )}
              </button>

              <button
                onClick={() => setSelectedMeal("dinner")}
                className={`px-4 py-2 rounded-md ${
                  selectedMeal === "dinner"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${
                  attendanceStatus.isDinnerTime
                    ? "border-2 border-green-400"
                    : ""
                }`}
              >
                Dinner
                {attendanceStatus.isDinnerTime && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Now
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {markingSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200">
              {markingSuccess}
            </div>
          )}

          {markingError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
              {markingError}
            </div>
          )}

          {!attendanceStatus.canMarkAttendance && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md border border-yellow-200">
              Attendance marking is only available during meal times:
              <ul className="list-disc list-inside mt-1">
                <li>Breakfast: 8:00 AM - 9:30 AM</li>
                <li>Lunch: 12:30 PM - 2:00 PM</li>
                <li>Dinner: 8:00 PM - 9:30 PM</li>
              </ul>
            </div>
          )}

          <div>
            <button
              onClick={handleMarkAttendance}
              disabled={
                isMarkingAttendance || !attendanceStatus.canMarkAttendance
              }
              className={`px-4 py-2 rounded-md flex items-center ${
                isMarkingAttendance || !attendanceStatus.canMarkAttendance
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isMarkingAttendance ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Marking...
                </>
              ) : (
                "Mark Attendance"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Meal Attendance Records</h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="px-3 py-2 border border-gray-200 rounded"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setCurrentPage(1); // Reset to first page when changing month
            }}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-gray-200 rounded"
            value={mealType}
            onChange={(e) => {
              setMealType(e.target.value);
              setCurrentPage(1); // Reset to first page when changing meal type
            }}
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold border-b">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-b">
                      Day
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-b">
                      Meal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {formatDayName(record.date)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          <span className="capitalize">
                            {record.attendance}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 border rounded ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monthly Statistics</h2>
          <select
            className="px-3 py-1 border border-gray-200 rounded text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg mb-2 font-medium">Breakfast</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${stats.breakfast.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {stats.breakfast.count}/{stats.breakfast.count > 0 ? "30" : "0"}{" "}
                days
              </span>
              <span>{stats.breakfast.percentage}%</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="text-lg mb-2 font-medium">Lunch</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${stats.lunch.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {stats.lunch.count}/{stats.lunch.count > 0 ? "30" : "0"} days
              </span>
              <span>{stats.lunch.percentage}%</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="text-lg mb-2 font-medium">Dinner</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${stats.dinner.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {stats.dinner.count}/{stats.dinner.count > 0 ? "30" : "0"} days
              </span>
              <span>{stats.dinner.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
