"use client";
import { useState } from "react";
import { Save, AlertCircle, PlusCircle, Trash2 } from "lucide-react";

// Define types for menu items and menu structure
interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface MealMenu {
  [meal: string]: MenuItem[];
}

interface WeeklyMenu {
  [day: string]: MealMenu;
}

export default function MessMenuManagement() {
  // Days of the week
  const daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Meals of the day
  const mealsOfDay: string[] = ['Breakfast', 'Lunch', 'Dinner'];
  
  // Initial menu state - populated with sample data
  const [menu, setMenu] = useState<WeeklyMenu>(
    daysOfWeek.reduce((acc: WeeklyMenu, day) => {
      acc[day] = {
        Breakfast: [
          { id: `${day}-b-1`, name: 'Bread & Butter', price: 20 },
          { id: `${day}-b-2`, name: 'Tea/Coffee', price: 10 },
          { id: `${day}-b-3`, name: 'Eggs', price: 15 },
        ],
        Lunch: [
          { id: `${day}-l-1`, name: 'Rice', price: 15 },
          { id: `${day}-l-2`, name: 'Dal', price: 20 },
          { id: `${day}-l-3`, name: 'Vegetable Curry', price: 25 },
        ],
        Dinner: [
          { id: `${day}-d-1`, name: 'Roti', price: 15 },
          { id: `${day}-d-2`, name: 'Paneer', price: 30 },
          { id: `${day}-d-3`, name: 'Salad', price: 10 },
        ]
      };
      return acc;
    }, {})
  );
  
  // Default price state
  const [defaultPrice, setDefaultPrice] = useState<number>(60);
  
  // State for active day and meal tabs
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [activeMeal, setActiveMeal] = useState<string>('Breakfast');

  // State for showing success message
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  // Function to add new item to menu
  const addMenuItem = () => {
    const newItem: MenuItem = { 
      id: `${activeDay}-${activeMeal[0].toLowerCase()}-${menu[activeDay][activeMeal].length + 1}`, 
      name: 'New Item', 
      price: 20 
    };
    
    setMenu({
      ...menu,
      [activeDay]: {
        ...menu[activeDay],
        [activeMeal]: [...menu[activeDay][activeMeal], newItem]
      }
    });
  };
  
  // Function to delete item from menu
  const deleteMenuItem = (itemId: string) => {
    setMenu({
      ...menu,
      [activeDay]: {
        ...menu[activeDay],
        [activeMeal]: menu[activeDay][activeMeal].filter(item => item.id !== itemId)
      }
    });
  };
  
  // Function to update menu item name
  const updateMenuItemName = (itemId: string, newName: string) => {
    setMenu({
      ...menu,
      [activeDay]: {
        ...menu[activeDay],
        [activeMeal]: menu[activeDay][activeMeal].map(item => 
          item.id === itemId ? { ...item, name: newName } : item
        )
      }
    });
  };
  
  // Function to update menu item price
  const updateMenuItemPrice = (itemId: string, newPrice: string) => {
    setMenu({
      ...menu,
      [activeDay]: {
        ...menu[activeDay],
        [activeMeal]: menu[activeDay][activeMeal].map(item => 
          item.id === itemId ? { ...item, price: parseInt(newPrice) || 0 } : item
        )
      }
    });
  };
  
  // Function to save menu changes
  const saveChanges = () => {
    // In a real app, this would send the data to an API
    console.log("Saving menu:", menu);
    console.log("Default price:", defaultPrice);
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Hostel Mess Menu Management</h1>
          <div className="flex items-center">
            <div className="mr-4">
              <label className="block text-sm font-medium text-gray-700">Default Meal Price (₹)</label>
              <input 
                type="number" 
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(parseInt(e.target.value) || 0)}
                className="mt-1 p-2 border border-gray-300 rounded-md w-24"
              />
            </div>
            <button 
              onClick={saveChanges}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              <Save size={18} className="mr-2" />
              Save Changes
            </button>
          </div>
        </div>
        
        {showSuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
            <AlertCircle size={20} className="mr-2" />
            Menu updated successfully!
          </div>
        )}
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                    activeDay === day
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {mealsOfDay.map(meal => (
                <button
                  key={meal}
                  onClick={() => setActiveMeal(meal)}
                  className={`mr-8 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeMeal === meal
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{activeDay} - {activeMeal} Menu</h2>
            <button 
              onClick={addMenuItem}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
            >
              <PlusCircle size={16} className="mr-1" />
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menu[activeDay][activeMeal].map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateMenuItemName(item.id, e.target.value)}
                        className="p-1 border border-gray-300 rounded-md w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateMenuItemPrice(item.id, e.target.value)}
                        className="p-1 border border-gray-300 rounded-md w-24"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => deleteMenuItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-2">Preview</h3>
          <div className="grid grid-cols-3 gap-4">
            {menu[activeDay][activeMeal].map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-600">₹{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}