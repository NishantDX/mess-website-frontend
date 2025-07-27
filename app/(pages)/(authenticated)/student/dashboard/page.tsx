// app/(pages)/(authenticated)/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import your standalone components
import { UserInfoCard } from "@/components/dashboard/userSummary";
import { TodayMenuCard } from "@/components/dashboard/todayMenuCard";
import { MonthlyStatsCard } from "@/components/dashboard/monthlyStats";
import { AnnouncementsCard } from "@/components/dashboard/announcementsCard";

export default function Dashboard() {
  const [mealTime, setMealTime] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Only determine current meal time here - data fetching is now in components
    const determineMealTime = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 7 && currentHour < 10) {
        setMealTime("breakfast");
      } else if (currentHour >= 12 && currentHour < 15) {
        setMealTime("lunch");
      } else if (currentHour >= 19 && currentHour < 22) {
        setMealTime("dinner");
      } else {
        setMealTime(null);
      }
    };

    determineMealTime();
    setLoading(false);
  }, []);

  const handleMarkAttendance = () => {
    toast.success("Attendance marked successfully");
    // In a real app, you'd make an API call here
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blue-primary)] mx-auto"></div>
          <p className="mt-4 mess-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mess-section">
      <div className="flex flex-col md:flex-row gap-6">
        {/* User info component - handles its own data fetching */}
        <UserInfoCard />
        
        {/* Today's menu component - handles its own data fetching */}
        <TodayMenuCard />
      </div>

      {/* Meal time alert - only shown when a meal is active */}
      {/* {mealTime && (
        <Alert className="bg-[var(--green-light)] border-[var(--green-primary)]">
          <AlertTitle>Meal Time Active!</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)} is
              currently being served.
            </span>
            <Button 
              className="mess-btn mess-btn-primary"
              onClick={handleMarkAttendance}
            >
              Mark Attendance
            </Button>
          </AlertDescription>
        </Alert>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly stats component - handles its own data fetching */}
        <MonthlyStatsCard />
        
        {/* Announcements component - handles its own data fetching */}
        <AnnouncementsCard />
      </div>
    </div>
  );
}