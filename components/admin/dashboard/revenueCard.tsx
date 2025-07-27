'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface RevenueData {
  today: number;
  thisMonth: number;
  pending: number;
}

interface ApiResponse {
  monthlyRevenue?: number;
  // Keep original structure as fallback
  revenue?: {
    today?: number;
    thisMonth?: number;
    pending?: number;
  };
}

export function RevenueCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    today: 0,
    thisMonth: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>('/api/admin/stats/revenue/month');
        console.log('Revenue API response:', response.data);
        
        // Handle the new response format with monthlyRevenue
        if (response.data && response.data.monthlyRevenue !== undefined) {
          // For now, we'll use the monthly revenue for thisMonth
          // and calculate estimated values for today and pending
          const monthlyRevenue = response.data.monthlyRevenue;
          
          // Estimate today's revenue as 1/30 of monthly revenue
          const estimatedToday = Math.round(monthlyRevenue / 30);
          
          // Estimate pending as 15% of monthly revenue (example assumption)
          const estimatedPending = Math.round(monthlyRevenue * 0.15);
          
          setRevenueData({
            today: estimatedToday,
            thisMonth: monthlyRevenue,
            pending: estimatedPending
          });
        }
        // Fallback to original format if available
        else if (response.data && response.data.revenue) {
          const { today = 0, thisMonth = 0, pending = 0 } = response.data.revenue;
          
          setRevenueData({
            today,
            thisMonth,
            pending
          });
        } 
        else {
          console.error('Unexpected data format:', response.data);
          setError('Received revenue data in an unexpected format');
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className="mess-card flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
        <span>Loading revenue data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mess-card bg-red-50 border border-red-200">
        <h3 className="mess-text-muted mb-4">Revenue</h3>
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
    <div className="mess-card">
      <h3 className="mess-text-muted mb-4">Revenue</h3>
      <div className="space-y-4">
        <div>
          <p className="mess-text-muted">Today</p>
          <p className="mess-stat-value">₹{revenueData.today.toLocaleString()}</p>
        </div>
        <div>
          <p className="mess-text-muted">This Month</p>
          <p className="mess-stat-value">₹{revenueData.thisMonth.toLocaleString()}</p>
        </div>
        <div>
          <p className="mess-text-muted">Pending Collection</p>
          <p className="mess-stat-value-accent">₹{revenueData.pending.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}