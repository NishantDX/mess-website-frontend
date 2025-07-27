// components/dashboard/AnnouncementsCard.tsx
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "warning" | "info";
}

export function AnnouncementsCard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/announcements');
        setAnnouncements(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError("Failed to load announcements");
        
        // Fallback to mock data in case of error
        setAnnouncements([
          {
            id: "1",
            title: "Special Dinner on Friday",
            description: "Join us for a special dinner this Friday to celebrate the college festival.",
            date: "April 16, 2025",
            type: "warning"
          },
          {
            id: "2",
            title: "Mess Fee Payment Reminder",
            description: "Please clear all pending mess dues by the 25th of this month.",
            date: "April 12, 2025",
            type: "info"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">Loading announcements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-red-50 rounded-md border-l-4 border-red-400">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`p-3 rounded-md border-l-4 ${
                announcement.type === "warning" 
                  ? "bg-yellow-50 border-yellow-400" 
                  : "bg-blue-50 border-blue-400"
              }`}
            >
              <p className="font-medium">{announcement.title}</p>
              <p className="text-sm mt-1">{announcement.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Posted on {announcement.date}
              </p>
            </div>
          ))}
          
          {announcements.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No announcements at this time
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}