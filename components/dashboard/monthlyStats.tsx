"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { useAuth } from "@/app/(pages)/(authenticated)/store/authStore";

interface MealStats {
  breakfast: {
    eaten: number;
    total: number;
    percentage: number;
  };
  lunch: {
    eaten: number;
    total: number;
    percentage: number;
  };
  dinner: {
    eaten: number;
    total: number;
    percentage: number;
  };
}

export function MonthlyStatsCard() {
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const fetchMealStats = async () => {
      try {
        if (!user?.student_id) {
          setError("User information not available");
          setLoading(false);
          return;
        }

        setLoading(true);

        // Fetch the attendance records for this user
        const response = await axios.get(`/api/attendance/${user.student_id}`);
        console.log("Attendance API response:", response.data);
        const attendanceRecords = response.data.records;

        if (!Array.isArray(attendanceRecords)) {
          throw new Error("Invalid response format");
        }

        // Calculate the number of days in the current month
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).getDate();

        // Filter records for current month only
        const currentMonthRecords = attendanceRecords.filter((record) => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear
          );
        });

        // Calculate meal stats based on current month attendance records
        const breakfastAttendance = currentMonthRecords.filter(
          (record) => record.attendance === "breakfast"
        ).length;
        const lunchAttendance = currentMonthRecords.filter(
          (record) => record.attendance === "lunch"
        ).length;
        const dinnerAttendance = currentMonthRecords.filter(
          (record) => record.attendance === "dinner"
        ).length;

        // Calculate total possible meals (one of each type per day)
        const totalPossiblePerMealType = daysInMonth;

        // Calculate percentages (cap at 100%)
        const breakfastPercentage = Math.min(
          100,
          (breakfastAttendance / totalPossiblePerMealType) * 100
        );
        const lunchPercentage = Math.min(
          100,
          (lunchAttendance / totalPossiblePerMealType) * 100
        );
        const dinnerPercentage = Math.min(
          100,
          (dinnerAttendance / totalPossiblePerMealType) * 100
        );

        // Create stats object
        const calculatedStats: MealStats = {
          breakfast: {
            eaten: breakfastAttendance,
            total: totalPossiblePerMealType,
            percentage: breakfastPercentage,
          },
          lunch: {
            eaten: lunchAttendance,
            total: totalPossiblePerMealType,
            percentage: lunchPercentage,
          },
          dinner: {
            eaten: dinnerAttendance,
            total: totalPossiblePerMealType,
            percentage: dinnerPercentage,
          },
        };

        setStats(calculatedStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch meal statistics:", err);
        setError("Failed to load meal statistics");
        // Removed mock data fallback - we only use actual API data now
      } finally {
        setLoading(false);
      }
    };

    fetchMealStats();
  }, [user, authLoading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">
              Loading statistics...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-red-50 rounded-md border-l-4 border-red-400">
            <p className="text-sm text-red-700">
              {error || "No data available"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Breakfast</span>
            <span>
              {stats.breakfast.eaten}/{stats.breakfast.total}
            </span>
          </div>
          <Progress value={stats.breakfast.percentage} className="h-2" />

          <div className="flex justify-between mt-2">
            <span>Lunch</span>
            <span>
              {stats.lunch.eaten}/{stats.lunch.total}
            </span>
          </div>
          <Progress value={stats.lunch.percentage} className="h-2" />

          <div className="flex justify-between mt-2">
            <span>Dinner</span>
            <span>
              {stats.dinner.eaten}/{stats.dinner.total}
            </span>
          </div>
          <Progress value={stats.dinner.percentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
