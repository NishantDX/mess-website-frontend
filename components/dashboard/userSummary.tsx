// components/dashboard/userSummary.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/app/(pages)/(authenticated)/store/authStore";

interface MealStats {
  mealsEaten: number;
  totalMeals: number;
  dueAmount: number;
  lastMeal: string;
  mealTypes: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export function UserInfoCard() {
  // Split into separate states for better control
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { logOut, user, loading: authLoading } = useAuth();

  // components/dashboard/userSummary.tsx
  const fetchMealStats = useCallback(async () => {
    if (authLoading) return;

    if (!user?.student_id) {
      setError("User information not available");
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      setError(null);

      // Fetch attendance records
      const response = await axios.get(`/api/attendance/${user.student_id}`);

      // Process the attendance data to calculate stats
      const attendanceRecords = response.data.records;
      console.log("Attendance Records:", attendanceRecords);
      console.log("Response type:", typeof attendanceRecords);
      console.log("Is array:", Array.isArray(attendanceRecords));

      // Check if we have valid records
      if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        throw new Error("No attendance data available");
      }

      // 1. Filter records for current month
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const currentMonthRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        );
      });

      // 2. Calculate total meals eaten in current month
      const mealsEaten = currentMonthRecords.length;

      // 3. Calculate total possible meals in the current month (days * 3 meals)
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      const totalMeals = daysInMonth * 3; // 3 meals per day

      // 4. Get the last meal date from ALL records (not just current month)
      // Sort all attendance records by date in descending order to find the most recent meal
      const sortedAllDates = [...attendanceRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const lastMeal =
        sortedAllDates.length > 0
          ? sortedAllDates[0].date
          : new Date().toISOString().split("T")[0]; // fallback to today

      // 5. Count the number of each meal type in current month
      const mealTypes = {
        breakfast: currentMonthRecords.filter(
          (record) => record.attendance === "breakfast"
        ).length,
        lunch: currentMonthRecords.filter(
          (record) => record.attendance === "lunch"
        ).length,
        dinner: currentMonthRecords.filter(
          (record) => record.attendance === "dinner"
        ).length,
      };

      // 6. Calculate due amount based on meal type rates for current month
      const mealRates = {
        breakfast: 60,
        lunch: 60,
        dinner: 60,
      };

      const dueAmount =
        mealTypes.breakfast * mealRates.breakfast +
        mealTypes.lunch * mealRates.lunch +
        mealTypes.dinner * mealRates.dinner;

      // Set the processed data
      setMealStats({
        mealsEaten,
        totalMeals,
        dueAmount,
        lastMeal,
        mealTypes,
      });
      setError(null);
    } catch (err) {
      console.error("Error processing meal stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load meal statistics"
      );
      setMealStats(null);

      // For development, you might want to use mock data
      if (process.env.NODE_ENV === "development") {
        setMealStats({
          mealsEaten: 15,
          totalMeals: 90,
          dueAmount: 900,
          lastMeal: new Date().toISOString().split("T")[0],
          mealTypes: {
            breakfast: 5,
            lunch: 5,
            dinner: 5,
          },
        });
        setError(null); // Clear error when using mock data
      }
    } finally {
      setLoadingStats(false);
    }
  }, [user?.student_id, authLoading]);

  useEffect(() => {
    fetchMealStats();
  }, [fetchMealStats]);

  const handleSignOut = async () => {
    try {
      await logOut();
      // The redirect will be handled by your auth listener in layout.tsx
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Loading state while waiting for auth user AND meal stats
  if (authLoading || !user || loadingStats) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Loading your profile...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">
              Loading your profile information...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User is present but meal stats failed
  if (error || !mealStats) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Welcome, {user.name || "User"}</CardTitle>
              <CardDescription>
                Student ID: {user.student_id || "Unknown"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm text-red-600">
              {error || "Meal statistics are not available"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50"
              onClick={fetchMealStats}
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mealsPercentage = (mealStats.mealsEaten / mealStats.totalMeals) * 100;
  const lastMealDate = new Date(mealStats.lastMeal);

  // All data is available
  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Welcome, {user.name || "User"}</CardTitle>
            <CardDescription>
              Student ID: {user.student_id || "Unknown"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Monthly Meal Usage</span>
              <span className="text-sm font-medium">
                {mealStats.mealsEaten}/{mealStats.totalMeals}
              </span>
            </div>
            <Progress value={mealsPercentage} className="h-2" />
          </div>

          {/* Add meal type breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <p className="text-xs text-gray-500">Breakfast</p>
              <p className="text-sm font-medium">
                {mealStats.mealTypes.breakfast}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Lunch</p>
              <p className="text-sm font-medium">{mealStats.mealTypes.lunch}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Dinner</p>
              <p className="text-sm font-medium">
                {mealStats.mealTypes.dinner}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Current Due</p>
              <p className="text-2xl font-bold">₹{mealStats.dueAmount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Last Meal</p>
              <p className="text-lg font-medium">
                {lastMealDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm">{lastMealDate.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
