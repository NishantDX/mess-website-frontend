"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Calendar, Download, AlertCircle } from "lucide-react";
import axios from "axios";
import AttendanceByMealType from "@/components/admin/attendance/attendanceByMealType";
import WeeklyAttendanceTrends from "@/components/admin/attendance/weeklyAttendanceTrends";

// Add this interface to define the type for student objects
interface Student {
  id: number;
  uid: string;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

// Interface for API student response
interface StudentResponse {
  totalStudents: number;
}

// Interface for attendance record from API
interface AttendanceRecord {
  _id?: string;
  student_id: string;
  student_name?: string;
  date?: string;
  // Support both formats
  attendance?: "breakfast" | "lunch" | "dinner";
  timestamp?: string;
}

// Interface for API attendance response
interface AttendanceResponse {
  totalRecords: number;
  mealCounts: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  records: AttendanceRecord[];
}

// Interface for weekly data
interface WeeklyData {
  day: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}

// Interface for historical attendance data
interface HistoricalAttendance {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<string>("today");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMeal, setSelectedMeal] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Student data state
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Attendance data
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  // Historical attendance data
  const [historicalData, setHistoricalData] = useState<HistoricalAttendance[]>(
    []
  );

  // Summary state
  const [summary, setSummary] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    total: 0,
  });

  // Weekly data
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  // API call to fetch students and attendance data
  const fetchData = useCallback(
    async (
      page: number,
      limit: number,
      searchTerm: string = "",
      meal: string = "all",
      date: Date = new Date()
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        // Format date for API request - YYYY-MM-DD
        const formattedDate = date.toISOString().split("T")[0];

        // Fetch student stats
        const studentResponse = await axios.get<StudentResponse>(
          "/api/admin/stats/students"
        );

        // Fetch all students (for department data)
        const allStudentsResponse = await axios.get<{ students: Student[] }>(
          "/api/students/"
        );

        // Fetch attendance data for the selected date
        const attendanceResponse = await axios.get<AttendanceResponse>(
          `/api/admin/attendance?date=${formattedDate}`
        );

        // Fetch all historical attendance data (without date parameter)
        const historicalResponse = await axios.get<AttendanceResponse>(
          "/api/admin/attendance"
        );

        // Save all students data
        const allStudentsData = allStudentsResponse.data.students || [];
        setAllStudents(allStudentsData);

        // Process student data
        const studentData = studentResponse.data;
        const totalStudentsCount =
          studentData.totalStudents || allStudentsData.length;
        setTotalStudents(totalStudentsCount);

        // Process current day attendance data
        const attendanceData = attendanceResponse.data;
        const records = attendanceData.records || [];
        setAttendanceData(records);

        // Use meal counts from the API response
        const mealCounts = attendanceData.mealCounts || {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        };

        setSummary({
          breakfast: mealCounts.breakfast,
          lunch: mealCounts.lunch,
          dinner: mealCounts.dinner,
          total: totalStudentsCount,
        });

        // Generate student list with attendance information
        const studentsWithAttendance = processAttendanceWithStudents(
          records,
          allStudentsData
        );
        setStudents(studentsWithAttendance);

        // Apply filters
        let filtered = [...studentsWithAttendance];

        // Apply search filter
        if (searchTerm) {
          filtered = filtered.filter(
            (student) =>
              student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.student_id
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }

        // Apply meal filter
        if (meal !== "all") {
          filtered = filtered.filter((student) => {
            if (meal === "breakfast") return student.breakfast;
            if (meal === "lunch") return student.lunch;
            if (meal === "dinner") return student.dinner;
            return true;
          });
        }

        setFilteredStudents(filtered);

        // Process historical data for weekly trends
        const historicalRecords = historicalResponse.data.records || [];

        // Process historical data into daily attendance statistics
        processHistoricalData(historicalRecords, totalStudentsCount);

        // Generate weekly data from historical records
        generateWeeklyData(historicalRecords, totalStudentsCount);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load attendance data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [] // If fetchData does not use any props or state, leave this empty. Otherwise, add dependencies here.
  );

  // Process historical attendance data
  const processHistoricalData = (
    records: AttendanceRecord[],
    totalCount: number
  ): void => {
    // Group records by date
    const recordsByDate = records.reduce<Record<string, AttendanceRecord[]>>(
      (acc, record) => {
        const date = record.date || "";
        if (!acc[date]) acc[date] = [];
        acc[date].push(record);
        return acc;
      },
      {}
    );

    // Convert to historical attendance data format
    const historical = Object.entries(recordsByDate).map(([date, records]) => {
      let breakfast = 0;
      let lunch = 0;
      let dinner = 0;

      records.forEach((record) => {
        if (record.attendance === "breakfast") breakfast++;
        if (record.attendance === "lunch") lunch++;
        if (record.attendance === "dinner") dinner++;
      });

      return {
        date,
        breakfast,
        lunch,
        dinner,
        total: totalCount,
      };
    });

    // Sort by date (newest first)
    historical.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setHistoricalData(historical);
  };

  // Generate weekly data from historical records
  const generateWeeklyData = (
    records: AttendanceRecord[],
    totalCount: number
  ): void => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Get dates for the past week
    const weekly: WeeklyData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Initialize with default values
      weekly.push({
        day: dayName,
        date: formattedDate,
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      });
    }

    // Fill in actual data from records
    if (records && records.length > 0) {
      records.forEach((record) => {
        if (!record.date) {
          return;
        }

        const recordDate = record.date;
        const weekDay = weekly.find((day) => day.date === recordDate);

        if (weekDay) {
          // We found a matching date in our weekly data
          if (record.attendance === "breakfast") weekDay.breakfast++;
          if (record.attendance === "lunch") weekDay.lunch++;
          if (record.attendance === "dinner") weekDay.dinner++;
        }
      });
    }

    setWeeklyData(weekly);
  };

  // Process attendance records with student info
  const processAttendanceWithStudents = (
    records: AttendanceRecord[],
    allStudents: Student[]
  ): Student[] => {
    // Create a map of student_id to attendance status
    const attendanceMap = new Map<
      string,
      { breakfast: boolean; lunch: boolean; dinner: boolean }
    >();

    records.forEach((record) => {
      const currentAttendance = attendanceMap.get(record.student_id) || {
        breakfast: false,
        lunch: false,
        dinner: false,
      };

      if (record.attendance === "breakfast") {
        currentAttendance.breakfast = true;
      } else if (record.attendance === "lunch") {
        currentAttendance.lunch = true;
      } else if (record.attendance === "dinner") {
        currentAttendance.dinner = true;
      }

      attendanceMap.set(record.student_id, currentAttendance);
    });

    // Merge with student information
    return allStudents.map((student) => {
      const attendance = attendanceMap.get(student.student_id) || {
        breakfast: false,
        lunch: false,
        dinner: false,
      };

      return {
        ...student,
        breakfast: attendance.breakfast,
        lunch: attendance.lunch,
        dinner: attendance.dinner,
      };
    });
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setSearchQuery(query);

    // Apply search filter immediately on client side
    let filtered = [...students];

    if (query) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(query.toLowerCase()) ||
          student.student_id.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Also apply meal filter
    if (selectedMeal !== "all") {
      filtered = filtered.filter((student) => {
        if (selectedMeal === "breakfast") return student.breakfast;
        if (selectedMeal === "lunch") return student.lunch;
        if (selectedMeal === "dinner") return student.dinner;
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  // Handle meal selection
  const handleMealChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const meal = e.target.value;
    setSelectedMeal(meal);

    // Apply meal filter immediately on client side
    let filtered = [...students];

    if (meal !== "all") {
      filtered = filtered.filter((student) => {
        if (meal === "breakfast") return student.breakfast;
        if (meal === "lunch") return student.lunch;
        if (meal === "dinner") return student.dinner;
        return true;
      });
    }

    // Also apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  // Handle date change
  const handleDateChange = (date: Date): void => {
    setSelectedDate(date);
    setCurrentPage(1); // Reset to first page when changing date
  };

  // Handle tab change
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  // Apply filters and fetch data when dependencies change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(
        currentPage,
        itemsPerPage,
        searchQuery,
        selectedMeal,
        selectedDate
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, selectedDate,searchQuery, selectedMeal, fetchData]);
  // Added fetchData to dependency array

  // Format date for display
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 rounded-t-lg flex justify-between items-center p-4 mb-6">
          <h1 className="text-xl font-semibold">Attendance Dashboard</h1>
          <div className="flex items-center gap-4"></div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-red-700">{error}</p>
              <button
                className="text-red-700 underline text-sm mt-1"
                onClick={() =>
                  fetchData(
                    currentPage,
                    itemsPerPage,
                    searchQuery,
                    selectedMeal,
                    selectedDate
                  )
                }
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white mb-6 rounded-lg shadow-sm">
          <div className="flex px-6 border-b border-gray-200">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "today"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("today")}
            >
              Today&apos;s Attendance
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("history")}
            >
              Attendance History
            </button>
          </div>

          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedMeal}
                  onChange={handleMealChange}
                >
                  <option value="all">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
              </div>
              <button
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                onClick={() => handleDateChange(new Date())}
              >
                <Calendar size={16} className="mr-2" />
                {formatDate(selectedDate).split(", ")[0]}
              </button>
              <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Total Students
              </h3>
            </div>
            <p className="text-2xl font-semibold">
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded-md"></div>
              ) : (
                summary.total
              )}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Breakfast</h3>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                {loading ? (
                  <div className="h-4 w-8 bg-gray-200 animate-pulse rounded-md"></div>
                ) : (
                  `${Math.round(
                    (summary.breakfast / (summary.total || 1)) * 100
                  )}%`
                )}
              </span>
            </div>
            <p className="text-2xl font-semibold">
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-md"></div>
              ) : (
                `${summary.breakfast} / ${summary.total}`
              )}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Lunch</h3>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                {loading ? (
                  <div className="h-4 w-8 bg-gray-200 animate-pulse rounded-md"></div>
                ) : (
                  `${Math.round((summary.lunch / (summary.total || 1)) * 100)}%`
                )}
              </span>
            </div>
            <p className="text-2xl font-semibold">
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-md"></div>
              ) : (
                `${summary.lunch} / ${summary.total}`
              )}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Dinner</h3>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                {loading ? (
                  <div className="h-4 w-8 bg-gray-200 animate-pulse rounded-md"></div>
                ) : (
                  `${Math.round(
                    (summary.dinner / (summary.total || 1)) * 100
                  )}%`
                )}
              </span>
            </div>
            <p className="text-2xl font-semibold">
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-md"></div>
              ) : (
                `${summary.dinner} / ${summary.total}`
              )}
            </p>
          </div>
        </div>

        {/* Today's Attendance View */}
        {activeTab === "today" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance by Meal Type Component */}
            <AttendanceByMealType />

            {/* Weekly Attendance Trends Component */}
            <WeeklyAttendanceTrends />
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium">Attendance History</h3>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : historicalData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Breakfast
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lunch
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Dinner
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total Attendance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historicalData.map((day, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(day.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-blue-600 font-medium">
                              {day.breakfast}
                            </span>{" "}
                            / {day.total} (
                            {Math.round((day.breakfast / day.total) * 100)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-green-600 font-medium">
                              {day.lunch}
                            </span>{" "}
                            / {day.total} (
                            {Math.round((day.lunch / day.total) * 100)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="text-orange-600 font-medium">
                              {day.dinner}
                            </span>{" "}
                            / {day.total} (
                            {Math.round((day.dinner / day.total) * 100)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {day.breakfast + day.lunch + day.dinner} meals
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No historical data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
