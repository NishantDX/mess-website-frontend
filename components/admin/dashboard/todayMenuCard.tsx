"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Loader2 } from "lucide-react";

interface MenuItems {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

interface ApiResponse {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  day?: string;
  requestedDate?: string;
  _id?: string;
  __v?: number;
}

export function TodayMenuCard() {
  const [activeMenu, setActiveMenu] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItems>({
    breakfast: [],
    lunch: [],
    dinner: [],
  });
  const [day, setDay] = useState<string>("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];

        // Use the actual API endpoint
        const response = await axios.get<ApiResponse>(
          `/api/menu/date/${formattedDate}`
        );
        //console.log('Menu API response:', response.data);

        if (response.data) {
          // The API returns breakfast, lunch and dinner as comma-separated strings
          // We need to convert them to arrays
          const breakfast = response.data.breakfast
            ? response.data.breakfast.split(", ")
            : [];
          const lunch = response.data.lunch
            ? response.data.lunch.split(", ")
            : [];
          const dinner = response.data.dinner
            ? response.data.dinner.split(", ")
            : [];

          // Save the day from the response
          if (response.data.day) {
            setDay(response.data.day);
          }

          setMenuItems({
            breakfast,
            lunch,
            dinner,
          });
        } else {
          // If API doesn't return menu data yet, use placeholder data
          console.log("No menu data found, using placeholder data");
          // setMenuItems({
          //   breakfast: ['Poha', 'Bread & Butter', 'Tea'],
          //   lunch: ['Rice', 'Dal', 'Mixed Vegetables', 'Salad'],
          //   dinner: ['Chapati', 'Paneer Curry', 'Rice', 'Yogurt']
          // });
        }
      } catch (err) {
        console.error("Error fetching menu data:", err);
        setError("Failed to load today's menu data");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleEditMenu = (meal: string, items: string[]) => {
    console.log(`Opening edit interface for ${meal} menu:`, items);
    // This would open a modal in a real application
    // You could also make an API call to update the menu here
  };

  if (loading) {
    return (
      <div className="mess-card mb-6 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
        <span>Loading menu data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mess-card mb-6 bg-red-50 border border-red-200">
        <h3 className="mess-heading-md mb-4">Today's Menu</h3>
        <div className="text-red-500 py-4 text-center">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-2 text-sm underline text-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mess-card mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="mess-heading-md">Today's Menu</h3>
          {day && <p className="text-sm text-gray-500 mt-1">{day}</p>}
        </div>
        <div className="mess-menu-tabs">
          <button
            className={`mess-tab ${
              activeMenu === "all" ? "mess-tab-active" : ""
            }`}
            onClick={() => setActiveMenu("all")}
          >
            All
          </button>
          <button
            className={`mess-tab ${
              activeMenu === "breakfast" ? "mess-tab-active" : ""
            }`}
            onClick={() => setActiveMenu("breakfast")}
          >
            Breakfast
          </button>
          <button
            className={`mess-tab ${
              activeMenu === "lunch" ? "mess-tab-active" : ""
            }`}
            onClick={() => setActiveMenu("lunch")}
          >
            Lunch
          </button>
          <button
            className={`mess-tab ${
              activeMenu === "dinner" ? "mess-tab-active" : ""
            }`}
            onClick={() => setActiveMenu("dinner")}
          >
            Dinner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(activeMenu === "all" || activeMenu === "breakfast") && (
          <div className="mess-meal-card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Breakfast</h4>
              <span className="mess-meal-time">(7:00 AM - 10:00 AM)</span>
            </div>
            {menuItems.breakfast.length > 0 ? (
              <ul className="mess-menu-list">
                {menuItems.breakfast.map((item, index) => (
                  <li key={index} className="mess-menu-item">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">
                No breakfast items available
              </p>
            )}
          </div>
        )}

        {(activeMenu === "all" || activeMenu === "lunch") && (
          <div className="mess-meal-card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Lunch</h4>
              <span className="mess-meal-time">(12:00 PM - 3:00 PM)</span>
             
            </div>
            {menuItems.lunch.length > 0 ? (
              <ul className="mess-menu-list">
                {menuItems.lunch.map((item, index) => (
                  <li key={index} className="mess-menu-item">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">
                No lunch items available
              </p>
            )}
          </div>
        )}

        {(activeMenu === "all" || activeMenu === "dinner") && (
          <div className="mess-meal-card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Dinner</h4>
              <span className="mess-meal-time">(7:00 PM - 10:00 PM)</span>
              
            </div>
            {menuItems.dinner.length > 0 ? (
              <ul className="mess-menu-list">
                {menuItems.dinner.map((item, index) => (
                  <li key={index} className="mess-menu-item">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-2">
                No dinner items available
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
