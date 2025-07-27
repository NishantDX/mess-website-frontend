'use client'
import { useState, useEffect } from "react";
import { PieChart } from "lucide-react";
import axios from "axios";

interface MealSummary {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

export default function AttendanceByMealType() {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<MealSummary>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch on component mount
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format today's date for API request - YYYY-MM-DD
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      console.log("Fetching attendance data for date:", formattedDate);

      // Fetch student stats for total count
      const studentResponse = await axios.get("/api/admin/stats/students");
      console.log("Student response:", studentResponse.data);
      
      // Fetch attendance data for today
      const attendanceResponse = await axios.get(
        `/api/admin/attendance?date=${formattedDate}`
      );
      console.log("Attendance response:", attendanceResponse.data);

      const totalStudents = studentResponse.data.totalStudents || 0;
      const mealCounts = attendanceResponse.data.mealCounts || {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      };

      // If no meal counts for today, try to get the most recent day with data
      if (mealCounts.breakfast === 0 && mealCounts.lunch === 0 && mealCounts.dinner === 0) {
        console.log("No attendance data found for today, fetching most recent data");
        
        const historicalResponse = await axios.get("/api/admin/attendance");
        const records = historicalResponse.data.records || [];
        
        if (records.length > 0) {
          // Group by date
          const recordsByDate = {};
          records.forEach(record => {
            if (!record.date) return;
            
            if (!recordsByDate[record.date]) {
              recordsByDate[record.date] = {
                breakfast: 0,
                lunch: 0,
                dinner: 0
              };
            }
            
            if (record.attendance === "breakfast") recordsByDate[record.date].breakfast++;
            if (record.attendance === "lunch") recordsByDate[record.date].lunch++;
            if (record.attendance === "dinner") recordsByDate[record.date].dinner++;
          });
          
          // Find most recent date with data
          const sortedDates = Object.keys(recordsByDate).sort((a, b) => 
            new Date(b).getTime() - new Date(a).getTime()
          );
          
          if (sortedDates.length > 0) {
            const mostRecentDate = sortedDates[0];
            const mostRecentCounts = recordsByDate[mostRecentDate];
            
            console.log("Using data from most recent date:", mostRecentDate);
            
            mealCounts.breakfast = mostRecentCounts.breakfast;
            mealCounts.lunch = mostRecentCounts.lunch;
            mealCounts.dinner = mostRecentCounts.dinner;
          }
        }
      }

      setSummary({
        breakfast: mealCounts.breakfast,
        lunch: mealCounts.lunch,
        dinner: mealCounts.dinner,
        total: totalStudents,
      });
      
      console.log("Setting summary:", {
        breakfast: mealCounts.breakfast,
        lunch: mealCounts.lunch,
        dinner: mealCounts.dinner,
        total: totalStudents,
      });
    } catch (error) {
      console.error("Error fetching meal attendance data:", error);
      setError("Failed to load meal attendance data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">Attendance by Meal Type</h3>
        <div className="flex items-center text-sm text-gray-500">
          <PieChart size={16} className="mr-1" />
          Today's Statistics
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            {error}
          </div>
        ) : (
          <div className="flex justify-around h-64 items-center">
            {/* Breakfast chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="2"
                  />
                  <path
                    className="circle"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${
                      summary.total
                        ? (summary.breakfast / summary.total) * 100
                        : 0
                    }, 100`}
                  />
                  <text x="18" y="20.5" className="percentage">
                    {summary.total
                      ? Math.round(
                          (summary.breakfast / summary.total) * 100
                        )
                      : 0}
                    %
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium">Breakfast</span>
              <span className="text-xs text-gray-500">
                {summary.breakfast} students
              </span>
            </div>

            {/* Rest of the component remains the same */}
            {/* Lunch chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="2"
                  />
                  <path
                    className="circle"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={`${
                      summary.total
                        ? (summary.lunch / summary.total) * 100
                        : 0
                    }, 100`}
                  />
                  <text x="18" y="20.5" className="percentage">
                    {summary.total
                      ? Math.round(
                          (summary.lunch / summary.total) * 100
                        )
                      : 0}
                    %
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium">Lunch</span>
              <span className="text-xs text-gray-500">
                {summary.lunch} students
              </span>
            </div>

            {/* Dinner chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="2"
                  />
                  <path
                    className="circle"
                    d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeDasharray={`${
                      summary.total
                        ? (summary.dinner / summary.total) * 100
                        : 0
                    }, 100`}
                  />
                  <text x="18" y="20.5" className="percentage">
                    {summary.total
                      ? Math.round(
                          (summary.dinner / summary.total) * 100
                        )
                      : 0}
                    %
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium">Dinner</span>
              <span className="text-xs text-gray-500">
                {summary.dinner} students
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .circular-chart {
          display: block;
          margin: 0 auto;
          overflow: visible;
        }
        .circle {
          transform: rotate(-90deg);
          transform-origin: center;
        }
        .percentage {
          font-family: sans-serif;
          font-size: 0.5rem;
          text-anchor: middle;
          font-weight: bold;
          fill: #666;
        }
      `}</style>
    </div>
  );
}