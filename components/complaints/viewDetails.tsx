import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';

interface ComplaintDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: {
    _id?: string;
    name: string;
    student_id: string;
    timestamp: string;
    issue: string;
    status: 'pending' | 'resolved';
    resolutionNote?: string;
  } | null;
  isAdmin: boolean;
  onResolve?: (complaintId: string, resolutionNote: string) => Promise<void>;
}

export default function ComplaintDetailsModal({
  isOpen,
  onClose,
  complaint,
  isAdmin = false,
  onResolve,
}: ComplaintDetailsProps) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleResolve = async () => {
    if (!onResolve || !complaint._id) return;
    
    setIsResolving(true);
    try {
      await onResolve(complaint._id, resolutionNote);
      onClose();
    } catch (error) {
      console.error("Failed to resolve complaint:", error);
      // You could add error handling UI here
    } finally {
      setIsResolving(false);
    }
  };

  // Format date to a readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-medium">Complaint Details</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{complaint.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-medium">{complaint.student_id}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(complaint.timestamp)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Issue</p>
              <p className="font-medium">{complaint.issue}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${
                complaint.status === 'resolved' 
                  ? 'text-green-600' 
                  : 'text-orange-500'
              }`}>
                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
              </p>
            </div>

            {complaint.status === 'resolved' && complaint.resolutionNote && (
              <div>
                <p className="text-sm text-gray-500">Resolution Note</p>
                <p className="font-medium">{complaint.resolutionNote}</p>
              </div>
            )}

            {isAdmin && complaint.status === 'pending' && (
              <div className="mt-6">
                <label htmlFor="resolutionNote" className="block mb-2 text-sm font-medium text-gray-700">
                  Resolution Note
                </label>
                <textarea
                  id="resolutionNote"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Enter resolution details..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          
          {isAdmin && complaint.status === 'pending' && (
            <button 
              onClick={handleResolve}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              {isResolving ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}