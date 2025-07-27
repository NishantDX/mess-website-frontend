'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface AttendanceData {
  breakfast: number;
  lunch: number;
  dinner: number;
  totalStudents: number;
}

interface ApiResponse {
  mealBreakdown?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  mealsServedToday?: number;
}

export function AttendanceCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    totalStudents: 250 // Default value until we get real data
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>('/api/admin/stats/meals/today');
        //console.log('API response:', response.data);
        
        if (response.data) {
          // If we have mealBreakdown, use it
          if (response.data.mealBreakdown) {
            const { breakfast, lunch, dinner } = response.data.mealBreakdown;
            
            setAttendanceData({
              breakfast,
              lunch,
              dinner,
              // You might want to fetch this from another API endpoint
              // For now using a default value
              totalStudents: 250
            });
          } 
          // If we have just mealsServedToday but no breakdown
          else if (response.data.mealsServedToday !== undefined) {
            // In a real app, you should fetch the actual total students from an API
            setAttendanceData({
              // Just showing the total for each meal since we don't have the breakdown
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              totalStudents: 250
            });
          }
          // Handle unexpected data format
          else {
            console.error('Unexpected data format:', response.data);
            setError('Received data in an unexpected format');
          }
        } else {
          setError('No data received from the API');
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="mess-card flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
        <span>Loading attendance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mess-card bg-red-50 border border-red-200">
        <h3 className="mess-text-muted mb-2">Today's Attendance</h3>
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

  const { breakfast, lunch, dinner, totalStudents } = attendanceData;
  
  // Safety function to prevent division by zero
  const calculatePercentage = (value: number) => {
    if (!totalStudents) return 0;
    return Math.min((value / totalStudents) * 100, 100);
  };

  return (
    <div className="mess-card">
      <h3 className="mess-text-muted mb-2">Today's Attendance</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span>Breakfast</span>
          <span className="font-semibold">{breakfast} / {totalStudents}</span>
        </div>
        <div className="mess-progress-container">
          <div 
            className="mess-progress-bar" 
            style={{ width: `${calculatePercentage(breakfast)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Lunch</span>
          <span className="font-semibold">{lunch} / {totalStudents}</span>
        </div>
        <div className="mess-progress-container">
          <div 
            className="mess-progress-bar" 
            style={{ width: `${calculatePercentage(lunch)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Dinner</span>
          <span className="font-semibold">{dinner} / {totalStudents}</span>
        </div>
        <div className="mess-progress-container">
          <div 
            className="mess-progress-bar" 
            style={{ width: `${calculatePercentage(dinner)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}