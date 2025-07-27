// app/(pages)/(authenticated)/menu/page.tsx
"use client";
import { JSX, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Info,
  ChevronDown,
  Filter,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

// Define the API response type
interface MenuApiItem {
  _id: string;
  day: string;
  breakfast: string;
  lunch: string; 
  dinner: string;
  __v: number;
}

// Define types for our app's data structure
interface NutritionalInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

interface Meal {
  items: string[];
  nutritionalInfo: NutritionalInfo;
}

interface DayMenu {
  breakfast: Meal;
  lunch: Meal;
  snacks: Meal;
  dinner: Meal;
}

interface WeeklyMenu {
  [key: string]: DayMenu;
}

interface SpecialMenuItem {
  day: string;
  meal: string;
  item: string;
}

// Nutritional info estimates for generated meals
const nutritionalInfoEstimates = {
  breakfast: {
    calories: 450,
    protein: '12g',
    carbs: '65g',
    fat: '15g'
  },
  lunch: {
    calories: 650,
    protein: '18g',
    carbs: '85g',
    fat: '22g'
  },
  snacks: {
    calories: 250,
    protein: '4g',
    carbs: '30g',
    fat: '12g'
  },
  dinner: {
    calories: 700,
    protein: '24g',
    carbs: '90g',
    fat: '25g'
  }
};

export default function MessMenu() {
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNutritionalInfo, setShowNutritionalInfo] =
    useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  // Get today's day name
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = days[new Date().getDay()];

  // For filtering
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg">(
    "all"
  );


  // Function to transform API data to our app's format
const transformApiToAppFormat = (apiData: MenuApiItem | MenuApiItem[]): WeeklyMenu => {
  const weeklyMenu: WeeklyMenu = {};
  
  // Handle both array and single object responses
  const menuItems = Array.isArray(apiData) ? apiData : [apiData];
  
  menuItems.forEach(item => {
    // Convert day to lowercase for consistency
    const day = item.day.toLowerCase();
    
    // Split comma-separated strings into arrays
    const breakfastItems = item.breakfast.split(',').map(i => i.trim());
    const lunchItems = item.lunch.split(',').map(i => i.trim());
    const dinnerItems = item.dinner.split(',').map(i => i.trim());
    
    // Default snack items since they're not in the API
    const snackItems = ['Tea/Coffee', 'Biscuits']; 
    
    weeklyMenu[day] = {
      breakfast: {
        items: breakfastItems,
        nutritionalInfo: nutritionalInfoEstimates.breakfast
      },
      lunch: {
        items: lunchItems,
        nutritionalInfo: nutritionalInfoEstimates.lunch
      },
      snacks: {
        items: snackItems,
        nutritionalInfo: nutritionalInfoEstimates.snacks
      },
      dinner: {
        items: dinnerItems,
        nutritionalInfo: nutritionalInfoEstimates.dinner
      }
    };
  });
  
  return weeklyMenu;
};

useEffect(() => {
  const fetchWeeklyMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/menu/week");
      console.log("API response:", response.data);

      // Check if response has the expected format with menus array
      if (response.data && response.data.menus && Array.isArray(response.data.menus)) {
        // Transform API data to our app's format
        const formattedMenu = transformApiToAppFormat(response.data.menus);
        console.log("Formatted menu:", formattedMenu);
        
        if (Object.keys(formattedMenu).length > 0) {
          setWeeklyMenu(formattedMenu);
        } else {
          setError("No menu data found for this week.");
        }
      } 
      // Handle alternative format where data might be directly an array
      else if (response.data && Array.isArray(response.data)) {
        const formattedMenu = transformApiToAppFormat(response.data);
        console.log("Formatted menu (direct array):", formattedMenu);
        
        if (Object.keys(formattedMenu).length > 0) {
          setWeeklyMenu(formattedMenu);
        } else {
          setError("No menu data found for this week.");
        }
      }
      // Handle case where data might be a single menu item
      else if (response.data && typeof response.data === 'object') {
        const formattedMenu = transformApiToAppFormat([response.data]);
        console.log("Formatted menu (single object):", formattedMenu);
        
        if (Object.keys(formattedMenu).length > 0) {
          setWeeklyMenu(formattedMenu);
        } else {
          setError("No menu data found for this week.");
        }
      } 
      else {
        console.error("Invalid API response format:", response.data);
        setError("Invalid response format from server.");
      }
    } catch (err) {
      console.error("Error fetching weekly menu:", err);
      setError("Failed to load the weekly menu. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchWeeklyMenu();
}, []);

  // Calculate next week's date range
  const getDateRange = (): string => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.

    // Get Monday of this week
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // Get Sunday of this week
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek));

    return `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
  };

  // Look for special items in the actual menu data
  const getSpecialMenuItems = (): SpecialMenuItem[] => {
    const specialItems: SpecialMenuItem[] = [];
    
    if (weeklyMenu) {
      // Find special items in the menu
      Object.entries(weeklyMenu).forEach(([day, dayMenu]) => {
        // Check for desserts and special items
        dayMenu.dinner.items.forEach(item => {
          if (
            item.toLowerCase().includes("gulab jamun") || 
            item.toLowerCase().includes("jalebi") || 
            item.toLowerCase().includes("ice cream") ||
            item.toLowerCase().includes("ras malai") || 
            item.toLowerCase().includes("pastry") ||
            item.toLowerCase().includes("custard")
          ) {
            specialItems.push({ day, meal: "dinner", item });
          }
        });
        
        // Check for special lunch items
        if (dayMenu.lunch.items.some(item => 
          item.toLowerCase().includes("paneer") || 
          item.toLowerCase().includes("pulao")
        )) {
          const item = dayMenu.lunch.items.find(i => 
            i.toLowerCase().includes("paneer") || i.toLowerCase().includes("pulao")
          ) || "";
          specialItems.push({ day, meal: "lunch", item });
        }
      });
    }
    
    // Return found special items or default ones if none found
    return specialItems.length > 0 ? specialItems : [
      { day: "tuesday", meal: "dinner", item: "Gulab Jamun" },
      { day: "friday", meal: "dinner", item: "Jalebi" },
      { day: "sunday", meal: "lunch", item: "Paneer Butter Masala" },
      { day: "wednesday", meal: "dinner", item: "Ice Cream" },
      { day: "saturday", meal: "dinner", item: "Ras Malai" },
    ];
  };

  const filterMenuItems = (items: string[]): string[] => {
    if (dietaryFilter === "all") return items;

    if (dietaryFilter === "veg") {
      return items.filter(
        (item: string) =>
          !item.toLowerCase().includes("chicken") &&
          !item.toLowerCase().includes("egg") &&
          !item.toLowerCase().includes("meat")
      );
    }

    if (dietaryFilter === "nonveg") {
      return items.filter(
        (item: string) =>
          item.toLowerCase().includes("chicken") ||
          item.toLowerCase().includes("egg") ||
          item.toLowerCase().includes("meat")
      );
    }

    return items;
  };

  const renderMealCard = (
    day: string,
    mealType: keyof DayMenu,
    meal: Meal,
    time: string
  ): JSX.Element => {
    // Ensure meal is defined and has items before filtering
    const items = meal?.items || [];
    const filteredItems = filterMenuItems(items);
    
    const specialItems = getSpecialMenuItems();
    const hasSpecialItem = specialItems.some(
      (special) => special.day === day && special.meal === mealType
    );

    return (
      <Card
        className={`mb-4 ${day === today ? "border-blue-300 shadow-md" : ""}`}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              {hasSpecialItem && (
                <Badge className="ml-2 bg-yellow-500">Special</Badge>
              )}
            </CardTitle>
            <CardDescription>{time}</CardDescription>
          </div>
          <div className="flex space-x-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedMeal(mealType);
                  }}
                >
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Nutritional Info</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nutritional Information</DialogTitle>
                  <DialogDescription>
                    Details for {mealType} on{" "}
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </DialogDescription>
                </DialogHeader>
                {selectedDay && selectedMeal && weeklyMenu && (
                  <div className="py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-700">
                          Calories
                        </p>
                        <p className="text-xl font-bold">
                          {
                            weeklyMenu[selectedDay]?.[
                              selectedMeal as keyof DayMenu
                            ]?.nutritionalInfo.calories
                          }{" "}
                          kcal
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-green-700">
                          Protein
                        </p>
                        <p className="text-xl font-bold">
                          {
                            weeklyMenu[selectedDay]?.[
                              selectedMeal as keyof DayMenu
                            ]?.nutritionalInfo.protein
                          }
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-orange-700">
                          Carbs
                        </p>
                        <p className="text-xl font-bold">
                          {
                            weeklyMenu[selectedDay]?.[
                              selectedMeal as keyof DayMenu
                            ]?.nutritionalInfo.carbs
                          }
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-red-700">Fat</p>
                        <p className="text-xl font-bold">
                          {
                            weeklyMenu[selectedDay]?.[
                              selectedMeal as keyof DayMenu
                            ]?.nutritionalInfo.fat
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        * Values are approximate and may vary based on serving
                        size.
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {filteredItems.map((item: string, index: number) => {
              const isSpecial = specialItems.some(
                (special) =>
                  special.day === day &&
                  special.meal === mealType &&
                  special.item.toLowerCase().includes(item.toLowerCase())
              );

              return (
                <li
                  key={index}
                  className={`text-gray-700 ${
                    isSpecial ? "font-medium text-yellow-700" : ""
                  }`}
                >
                  {item}
                  {isSpecial && " ✨"}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  };

  const handleExport = () => {
    // Function to export the menu as a PDF or text file
    alert("Export functionality will be implemented soon");
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mess Menu</h1>
          <div className="flex items-center text-gray-500 mt-1">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span className="text-sm">{getDateRange()}</span>
          </div>
        </div>

        {error && (
          <div className="w-full mt-2 mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md">
            <p>{error}</p>
          </div>
        )}

        <div className="flex space-x-2 mt-4 md:mt-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Dietary Preference</h4>
                  <Select
                    value={dietaryFilter}
                    onValueChange={(value: "all" | "veg" | "nonveg") =>
                      setDietaryFilter(value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="veg">Vegetarian Only</SelectItem>
                      <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={showNutritionalInfo}
                      onChange={() =>
                        setShowNutritionalInfo(!showNutritionalInfo)
                      }
                    />
                    <span>Show Nutritional Info</span>
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading weekly menu...</p>
          </div>
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">
                  Special Menu This Week
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getSpecialMenuItems().map((special, index) => (
                    <Badge key={index} variant="secondary" className="bg-white">
                      {special.item} (
                      {special.day.charAt(0).toUpperCase() +
                        special.day.slice(1)}
                      )
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={today} className="space-y-4">
            <TabsList className="grid grid-cols-7 md:grid-cols-7">
              <TabsTrigger value="monday">Mon</TabsTrigger>
              <TabsTrigger value="tuesday">Tue</TabsTrigger>
              <TabsTrigger value="wednesday">Wed</TabsTrigger>
              <TabsTrigger value="thursday">Thu</TabsTrigger>
              <TabsTrigger value="friday">Fri</TabsTrigger>
              <TabsTrigger value="saturday">Sat</TabsTrigger>
              <TabsTrigger value="sunday">Sun</TabsTrigger>
            </TabsList>

            {weeklyMenu && Object.keys(weeklyMenu).map((day) => (
              <TabsContent key={day} value={day} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {weeklyMenu[day]?.breakfast && renderMealCard(
                      day,
                      "breakfast",
                      weeklyMenu[day].breakfast,
                      "7:00 AM - 9:30 AM"
                    )}
                    {weeklyMenu[day]?.lunch && renderMealCard(
                      day,
                      "lunch",
                      weeklyMenu[day].lunch,
                      "12:00 PM - 2:30 PM"
                    )}
                  </div>
                  <div>
                    {weeklyMenu[day]?.snacks && renderMealCard(
                      day,
                      "snacks",
                      weeklyMenu[day].snacks,
                      "4:30 PM - 5:30 PM"
                    )}
                    {weeklyMenu[day]?.dinner && renderMealCard(
                      day,
                      "dinner",
                      weeklyMenu[day].dinner,
                      "7:30 PM - 9:30 PM"
                    )}
                  </div>
                </div>

                {showNutritionalInfo && weeklyMenu && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Daily Nutritional Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <p className="text-sm font-medium text-gray-500">
                            Total Calories
                          </p>
                          <p className="text-2xl font-bold">
                            {(weeklyMenu[day]?.breakfast?.nutritionalInfo.calories || 0) +
                              (weeklyMenu[day]?.lunch?.nutritionalInfo.calories || 0) +
                              (weeklyMenu[day]?.snacks?.nutritionalInfo.calories || 0) +
                              (weeklyMenu[day]?.dinner?.nutritionalInfo.calories || 0)}{" "}
                            kcal
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <p className="text-sm font-medium text-gray-500">
                            Protein
                          </p>
                          <p className="text-2xl font-bold">
                            {parseInt(
                              weeklyMenu[day]?.breakfast?.nutritionalInfo.protein || '0'
                            ) +
                              parseInt(
                                weeklyMenu[day]?.lunch?.nutritionalInfo.protein || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.snacks?.nutritionalInfo.protein || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.dinner?.nutritionalInfo.protein || '0'
                              )}
                            g
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <p className="text-sm font-medium text-gray-500">
                            Carbs
                          </p>
                          <p className="text-2xl font-bold">
                            {parseInt(
                              weeklyMenu[day]?.breakfast?.nutritionalInfo.carbs || '0'
                            ) +
                              parseInt(
                                weeklyMenu[day]?.lunch?.nutritionalInfo.carbs || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.snacks?.nutritionalInfo.carbs || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.dinner?.nutritionalInfo.carbs || '0'
                              )}
                            g
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <p className="text-sm font-medium text-gray-500">
                            Fat
                          </p>
                          <p className="text-2xl font-bold">
                            {parseInt(
                              weeklyMenu[day]?.breakfast?.nutritionalInfo.fat || '0'
                            ) +
                              parseInt(
                                weeklyMenu[day]?.lunch?.nutritionalInfo.fat || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.snacks?.nutritionalInfo.fat || '0'
                              ) +
                              parseInt(
                                weeklyMenu[day]?.dinner?.nutritionalInfo.fat || '0'
                              )}
                            g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}