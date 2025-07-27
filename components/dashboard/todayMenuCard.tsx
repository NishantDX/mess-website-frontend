"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, X } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/app/(pages)/(authenticated)/store/authStore";

interface MenuData {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export function TodayMenuCard() {
  const [todayMenu, setTodayMenu] = useState<MenuData | null>(null);
  const [mealTime, setMealTime] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Menu update modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [updatedMenu, setUpdatedMenu] = useState({
    day: "",
    breakfast: "",
    lunch: "",
    dinner: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const fetchTodayMenu = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      // Replace with your actual API endpoint
      const response = await axios
        .get(`/api/menu/date/${formattedDate}`)
        .catch((err) => {
          // Silently catch the request error to avoid console logs
          throw new Error("Failed to fetch today's menu");
        });

      // Check if the API response has the expected structure
      const responseData = response.data;

      // Ensure the data is in the correct format
      const formattedData: MenuData = {
        breakfast: Array.isArray(responseData.breakfast)
          ? responseData.breakfast
          : typeof responseData.breakfast === "string"
          ? [responseData.breakfast]
          : [],
        lunch: Array.isArray(responseData.lunch)
          ? responseData.lunch
          : typeof responseData.lunch === "string"
          ? [responseData.lunch]
          : [],
        dinner: Array.isArray(responseData.dinner)
          ? responseData.dinner
          : typeof responseData.dinner === "string"
          ? [responseData.dinner]
          : [],
      };

      setTodayMenu(formattedData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch today's menu:", err);
      setError("Failed to load today's menu");

      // Use mock data for development/errors
      setTodayMenu({
        breakfast: ["Idli", "Sambar", "Coconut Chutney", "Bread", "Tea/Coffee"],
        lunch: ["Chapati", "Dal Fry", "Mixed Veg Curry", "Rice", "Curd"],
        dinner: ["Pulao", "Paneer Butter Masala", "Raita", "Ice Cream"],
      });
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  const determineMealTime = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchTodayMenu();
    determineMealTime();
  }, [fetchTodayMenu, determineMealTime]);

  // Utility function to format menu items
  const formatMenuItems = (items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return "No items available";
    }
    return items.join(", ");
  };

  // Handle opening the edit menu modal
  const handleEditMenu = (meal: string) => {
    if (!todayMenu) return;

    // Get current day of the week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];

    setSelectedMeal(meal);

    // Initialize modal with current menu data
    setUpdatedMenu({
      day: today,
      breakfast: todayMenu.breakfast.join(", "),
      lunch: todayMenu.lunch.join(", "),
      dinner: todayMenu.dinner.join(", "),
    });

    setUpdateError("");
    setUpdateSuccess("");
    setIsMenuModalOpen(true);
  };

  // Handle input changes in the modal form
  const handleMenuInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setUpdatedMenu((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to update menu
  const handleSubmitMenuUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      // Send POST request to update menu
      const response = await axios.post("/api/menu", updatedMenu);

      // Update local state with new menu
      const newMenuItems = {
        breakfast: updatedMenu.breakfast.split(",").map((item) => item.trim()),
        lunch: updatedMenu.lunch.split(",").map((item) => item.trim()),
        dinner: updatedMenu.dinner.split(",").map((item) => item.trim()),
      };

      setTodayMenu(newMenuItems);
      setUpdateSuccess("Menu updated successfully!");

      // Close modal after a delay
      setTimeout(() => {
        setIsMenuModalOpen(false);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating menu:", error);
      setUpdateError(
        error.response?.data?.message ||
          "Failed to update menu. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Today's Menu</CardTitle>
          <CardDescription>Loading today's meals...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">
              Loading menu information...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !todayMenu) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Today's Menu</CardTitle>
          <CardDescription>Daily meal options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm text-red-600">
              {error || "Menu information is not available"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50"
              onClick={fetchTodayMenu}
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - show the menu with edit buttons
  return (
    <>
      <Card className="mess-card flex-1">
        <CardHeader>
          <CardTitle>Today's Menu</CardTitle>
          <CardDescription className="mess-text-muted">
            Daily meal options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mess-section">
            
            <div
              className={`p-3 rounded-md relative ${
                mealTime === "breakfast"
                  ? "bg-[var(--blue-light)] border border-[var(--blue-border)]"
                  : "bg-muted"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">
                  Breakfast{" "}
                  <span className="mess-text-muted">(7:00 AM - 10:00 AM)</span>
                </p>
              </div>
              <p className="text-sm mt-1">
                {formatMenuItems(todayMenu.breakfast)}
              </p>
            </div>
            <div
              className={`p-3 rounded-md relative ${
                mealTime === "lunch"
                  ? "bg-[var(--blue-light)] border border-[var(--blue-border)]"
                  : "bg-muted"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">
                  Lunch{" "}
                  <span className="mess-text-muted">(12:00 PM - 3:00 PM)</span>
                </p>
              </div>
              <p className="text-sm mt-1">{formatMenuItems(todayMenu.lunch)}</p>
            </div>
            <div
              className={`p-3 rounded-md relative ${
                mealTime === "dinner"
                  ? "bg-[var(--blue-light)] border border-[var(--blue-border)]"
                  : "bg-muted"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">
                  Dinner{" "}
                  <span className="mess-text-muted">(7:00 PM - 10:00 PM)</span>
                </p>
              </div>
              <p className="text-sm mt-1">
                {formatMenuItems(todayMenu.dinner)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
