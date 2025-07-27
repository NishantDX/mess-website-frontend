'use client'
import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import axios from 'axios';

// Interface for the data structure from the API
interface Announcement {
  id: string;
  title: string;
  description: string;  // API uses description instead of content
  postedOn: string;     // API uses postedOn instead of date
}

// Interface for API response - it's an array with a length property
interface ApiResponse {
  [key: number]: Announcement;
  length: number;
}

export function AnnouncementsCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/announcements');
        //console.log('Announcements API response:', response.data);
        
        // Handle the specific response format
        if (response.data && typeof response.data.length === 'number') {
          // Convert object with numeric keys to array
          const announcementsArray: Announcement[] = [];
          for (let i = 0; i < response.data.length; i++) {
            if (response.data[i]) {
              announcementsArray.push(response.data[i]);
            }
          }
          setAnnouncements(announcementsArray);
        } else {
          console.error('Unexpected data format for announcements:', response.data);
          setError('Received announcements data in an unexpected format');
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = () => {
    console.log('Opening add announcement interface');
    // This would open a modal in a real application
    // You could also navigate to an announcement creation page
  };

  if (loading) {
    return (
      <div className="mess-card flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
        <span>Loading announcements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mess-card bg-red-50 border border-red-200">
        <h3 className="mess-heading-md mb-4">Announcements</h3>
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="mess-heading-md">Announcements</h3>
        <button 
          className="bg-[var(--blue-primary)] text-white p-1 rounded-full"
          onClick={handleAddAnnouncement}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div key={announcement.id} className="border-l-4 border-[var(--blue-primary)] pl-4 py-2">
              <div className="flex justify-between">
                <h4 className="font-medium">{announcement.title}</h4>
                <span className="mess-text-muted">
                  {announcement.postedOn}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{announcement.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4 mess-text-muted">No announcements at this time</p>
      )}
    </div>
  );
}