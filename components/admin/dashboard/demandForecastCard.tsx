'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface ForecastResponse {
  targetDate: string;
  dayOfWeek: string;
  forecast: { breakfast: number; lunch: number; dinner: number };
  historicalPeak: { breakfast: number; lunch: number; dinner: number };
  estimatedPrepReductionPct: number | null;
  basedOnPastOccurrences: number;
  method: string;
  note: string;
}

export function DemandForecastCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ForecastResponse>('/api/predict');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching demand forecast:', err);
        setError('Failed to load demand forecast');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="mess-card flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
        <span>Loading demand forecast...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mess-card bg-red-50 border border-red-200">
        <h3 className="mess-text-muted mb-2">Demand Forecast</h3>
        <div className="text-red-500 py-4 text-center">
          {error || 'No forecast available'}
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

  const { forecast, historicalPeak, estimatedPrepReductionPct, basedOnPastOccurrences, dayOfWeek } = data;
  const meals: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];

  if (basedOnPastOccurrences === 0) {
    return (
      <div className="mess-card">
        <h3 className="mess-text-muted mb-2">Demand Forecast</h3>
        <p className="text-sm text-gray-500 py-4">
          Not enough historical data yet for {dayOfWeek}s — check back once a few weeks of attendance have been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="mess-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="mess-text-muted">Expected Turnout — {dayOfWeek}</h3>
        {estimatedPrepReductionPct !== null && estimatedPrepReductionPct > 0 && (
          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-1">
            ~{estimatedPrepReductionPct}% less prep vs. peak
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        {meals.map((meal) => (
          <div key={meal}>
            <div className="flex justify-between items-center">
              <span className="capitalize">{meal}</span>
              <span className="font-semibold">
                {forecast[meal]}{' '}
                <span className="text-xs text-gray-400">(peak {historicalPeak[meal]})</span>
              </span>
            </div>
            <div className="mess-progress-container">
              <div
                className="mess-progress-bar"
                style={{
                  width: `${historicalPeak[meal] ? Math.min((forecast[meal] / historicalPeak[meal]) * 100, 100) : 0}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Based on {basedOnPastOccurrences} past {dayOfWeek}s. Estimate, not a trained model or a measured outcome.
      </p>
    </div>
  );
}
