"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  CreditCard,
  PieChart,
} from "lucide-react";
import axios from "axios";

// Define interfaces for TypeScript
interface Student {
  _id: string;
  uid: string;
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  room_number?: string;
  dues?: number;
  attendanceSummary?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

interface AttendanceRecord {
  _id: string;
  student_id: string;
  student_name?: string;
  date: string;
  attendance: "breakfast" | "lunch" | "dinner";
  __v?: number;
}

interface NavItemProps {
  icon:
    | "home"
    | "message-square"
    | "clock"
    | "credit-card"
    | "users"
    | "settings"
    | "log-out";
  label: string;
  active?: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [totalDues, setTotalDues] = useState<number>(0);
  const [averageAttendance, setAverageAttendance] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch students data
      const studentsResponse = await axios.get("/api/students/");
      console.log("Students data:", studentsResponse.data);

      // Fetch attendance data
      const attendanceResponse = await axios.get("/api/admin/attendance");
      console.log("Attendance data:", attendanceResponse.data);

      // Extract data, handling the correct response structure
      // The API seems to be returning the students directly in the response
      // rather than in a 'students' property
      const studentsData = Array.isArray(studentsResponse.data)
        ? studentsResponse.data
        : studentsResponse.data?.students || [];

      const attendanceData = attendanceResponse.data?.records || [];

      if (!studentsData || studentsData.length === 0) {
        console.error("No students data found in API response");
        setError("No students data found. Please check API response.");
        return;
      }

      console.log(
        `Processing ${studentsData.length} students and ${attendanceData.length} attendance records`
      );

      setAttendance(attendanceData);

      // Process students with attendance data
      const processedStudents = processStudentData(
        studentsData,
        attendanceData
      );
      console.log("Processed students:", processedStudents);
      setStudents(processedStudents);

      // Calculate total dues
      const dues = processedStudents.reduce(
        (total, student) => total + (student.dues || 0),
        0
      );
      setTotalDues(dues);

      // Calculate average attendance based on API meal counts
      const mealCounts = attendanceResponse.data?.mealCounts || {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      };
      console.log("Meal counts:", mealCounts);
      calculateAverageAttendance(processedStudents, mealCounts);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      let message = "Unknown error";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      }
      setError(`Failed to load data: ${message}`);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // In the fetchData function, modify this section:
  // Update the fetchData function to fix the students data extraction

  // Update the processStudentData function to ensure it works with your API structure
  const processStudentData = (
    students: Student[],
    attendanceRecords: AttendanceRecord[]
  ): Student[] => {
    console.log("Inside processStudentData");

    // Ensure we have valid arrays
    if (!Array.isArray(students)) {
      console.error("students is not an array:", students);
      return [];
    }

    if (!Array.isArray(attendanceRecords)) {
      console.error("attendanceRecords is not an array:", attendanceRecords);
      return [];
    }

    // Create map of student IDs to attendance counts
    const attendanceCounts = new Map<
      string,
      { breakfast: number; lunch: number; dinner: number }
    >();
    attendanceRecords.forEach((record) => {
      const studentId = record.student_id;
      if (!studentId) {
        console.warn("Record missing student_id:", record);
        return;
      }

      if (!attendanceCounts.has(studentId)) {
        attendanceCounts.set(studentId, { breakfast: 0, lunch: 0, dinner: 0 });
      }

      const counts = attendanceCounts.get(studentId);
      if (counts && record.attendance) {
        // Use type assertion to tell TypeScript that attendance is a valid key
        const mealType = record.attendance as "breakfast" | "lunch" | "dinner";

        // Check if it's a valid meal type before incrementing
        if (
          mealType === "breakfast" ||
          mealType === "lunch" ||
          mealType === "dinner"
        ) {
          counts[mealType]++;
        } else {
          console.warn(
            `Invalid meal type "${mealType}" for student ${studentId}`
          );
        }
      }
    });

    console.log(`Built attendance map for ${attendanceCounts.size} students`);

    // Add attendance data to students
    return students.map((student) => {
      if (!student.student_id) {
        console.warn("Student missing student_id:", student);
      }

      const attendance = attendanceCounts.get(student.student_id) || {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      };

      // Add random dues for demo
      const dueAmount = Math.floor(Math.random() * 5) * 360;

      return {
        ...student,
        dues: dueAmount,
        attendanceSummary: attendance,
      };
    });
  };

  // And update the calculateAverageAttendance function
  const calculateAverageAttendance = (
    students: Student[],
    mealCounts: { breakfast: number; lunch: number; dinner: number }
  ) => {
    console.log("Calculating average attendance");

    if (students.length === 0) {
      console.warn("No students for attendance calculation");
      setAverageAttendance(0);
      return;
    }

    // Calculate total meals taken
    const totalMeals =
      mealCounts.breakfast + mealCounts.lunch + mealCounts.dinner;
    console.log(
      `Total meals: ${totalMeals} (B:${mealCounts.breakfast}, L:${mealCounts.lunch}, D:${mealCounts.dinner})`
    );

    // Calculate total possible meals for the last 30 days
    const totalPossibleMeals = students.length * 3 * 30;
    console.log(
      `Total possible meals: ${totalPossibleMeals} (${students.length} students × 3 meals × 30 days)`
    );

    // Calculate average attendance percentage
    const average =
      totalPossibleMeals > 0 ? (totalMeals / totalPossibleMeals) * 100 : 0;
    console.log(`Average attendance: ${average.toFixed(2)}%`);
    setAverageAttendance(Math.round(average));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white p-4 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-semibold">Students</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    className="text-sm text-red-700 underline mt-1"
                    onClick={fetchData}
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SummaryCard
                  title="Total Students"
                  value={students.length}
                  subtitle="Currently active"
                  icon={<Users className="h-6 w-6 text-blue-500" />}
                />
                <SummaryCard
                  title="Payment Pending"
                  value={`₹${totalDues.toLocaleString()}`}
                  subtitle={`From ${
                    students.filter((s) => (s.dues || 0) > 0).length
                  } students`}
                  icon={<CreditCard className="h-6 w-6 text-blue-500" />}
                />
                <SummaryCard
                  title="Average Attendance"
                  value={`${averageAttendance}%`}
                  subtitle="Last 30 days"
                  icon={<PieChart className="h-6 w-6 text-blue-500" />}
                />
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-semibold">
                    Student List ({filteredStudents.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option>Name</option>
                      <option>ID</option>
                      <option>Department</option>
                      <option>Dues</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mess Dues
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meal Attendance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {student.name?.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.department || "Not assigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm ${
                                (student.dues || 0) > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {(student.dues || 0) > 0
                                ? `₹${student.dues}`
                                : "No Dues"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">B</span>
                                <span className="text-sm font-medium">
                                  {student.attendanceSummary?.breakfast || 0}
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">L</span>
                                <span className="text-sm font-medium">
                                  {student.attendanceSummary?.lunch || 0}
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">D</span>
                                <span className="text-sm font-medium">
                                  {student.attendanceSummary?.dinner || 0}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length > 0 ? (
                  <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {indexOfFirstStudent + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastStudent, filteredStudents.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredStudents.length}
                      </span>{" "}
                      students
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className={`p-1 rounded-md border border-gray-300 ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={prevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-2 py-1 rounded-md border ${
                            currentPage === i + 1
                              ? "bg-blue-50 text-blue-600 border-blue-300"
                              : "border-gray-300 hover:bg-gray-50"
                          } text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      )).slice(
                        Math.max(0, currentPage - 3),
                        Math.min(totalPages, currentPage + 2)
                      )}
                      <button
                        className={`p-1 rounded-md border border-gray-300 ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-10 text-center text-gray-500">
                    No students found matching your search criteria
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-md">{icon}</div>
      </div>
    </div>
  );
}
