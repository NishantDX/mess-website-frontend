import { useState, useEffect, useCallback } from "react";
import { BarChart } from "lucide-react";
import axios from "axios";

// Interface for weekly data
interface WeeklyData {
  day: string;
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}

// Interface for API attendance response
interface AttendanceRecord {
  _id?: string;
  student_id: string;
  student_name?: string;
  date?: string;
  attendance?: "breakfast" | "lunch" | "dinner";
  timestamp?: string;
}

interface AttendanceResponse {
  totalRecords: number;
  mealCounts: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  records: AttendanceRecord[];
}

// Component takes no props now
export default function WeeklyAttendanceTrends() {
  const [loading, setLoading] = useState<boolean>(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch student stats for total count
      const studentResponse = await axios.get("/api/admin/stats/students");
      const totalCount = studentResponse.data.totalStudents || 0;
      setTotalStudents(totalCount);

      // Fetch all historical attendance data
      const historicalResponse = await axios.get<AttendanceResponse>(
        "/api/admin/attendance"
      );
      const records = historicalResponse.data.records || [];

      // Generate weekly data from historical records
      generateWeeklyData(records, totalCount);
    } catch (error) {
      console.error("Error fetching weekly attendance data:", error);
      setError("Failed to load attendance trends data");
    } finally {
      setLoading(false);
    }
  },[]);

  // Fetch data on component mount
  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">Weekly Attendance Trends</h3>
        <div className="flex items-center text-sm text-gray-500">
          <BarChart size={16} className="mr-1" />
          Last 7 Days
        </div>
      </div>
      <div className="p-4 pt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            {error}
          </div>
        ) : (
          <div className="h-64 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Grid lines */}
            <div className="absolute left-8 right-0 top-0 bottom-8 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-t border-gray-100 w-full h-0"
                ></div>
              ))}
            </div>

            <div className="flex h-56 items-end justify-between pl-8 pb-8">
              {weeklyData.map((day, index) => {
                // Calculate normalized heights (max height 150px)
                const maxHeight = 150;

                // Make sure we don't divide by zero
                const effectiveTotalStudents = totalStudents || 1; // Fallback to 1 if zero to avoid division by zero

                const breakfastPercent = day.breakfast / effectiveTotalStudents;
                const lunchPercent = day.lunch / effectiveTotalStudents;
                const dinnerPercent = day.dinner / effectiveTotalStudents;

                // Capped at 100% (1.0)
                const breakfastHeight =
                  Math.min(breakfastPercent, 1) * maxHeight;
                const lunchHeight = Math.min(lunchPercent, 1) * maxHeight;
                const dinnerHeight = Math.min(dinnerPercent, 1) * maxHeight;

                return (
                  <div
                    key={index}
                    className="flex flex-col justify-end h-full items-center group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-50 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <p className="font-medium mb-1">{day.day}</p>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>
                          Breakfast: {Math.round(breakfastPercent * 100)}% (
                          {day.breakfast})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>
                          Lunch: {Math.round(lunchPercent * 100)}% ({day.lunch})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>
                          Dinner: {Math.round(dinnerPercent * 100)}% (
                          {day.dinner})
                        </span>
                      </div>
                    </div>

                    {/* Bar group */}
                    <div className="flex space-x-1 items-end">
                      <div
                        className="w-4 bg-blue-500 rounded-t transition-all duration-300 ease-in-out hover:opacity-80"
                        style={{ height: `${breakfastHeight}px` }}
                      ></div>
                      <div
                        className="w-4 bg-green-500 rounded-t transition-all duration-300 ease-in-out hover:opacity-80"
                        style={{ height: `${lunchHeight}px` }}
                      ></div>
                      <div
                        className="w-4 bg-orange-500 rounded-t transition-all duration-300 ease-in-out hover:opacity-80"
                        style={{ height: `${dinnerHeight}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 font-medium">
                      {day.day.substring(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded mr-1"></span>
            <span className="text-xs text-gray-600">Breakfast</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded mr-1"></span>
            <span className="text-xs text-gray-600">Lunch</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-orange-500 rounded mr-1"></span>
            <span className="text-xs text-gray-600">Dinner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
