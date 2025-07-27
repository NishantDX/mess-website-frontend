'use client';
import { useState, useEffect } from 'react';
import { Filter, ChevronDown, Check, MessageSquare, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Define types for better type safety
type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

interface ComplaintNote {
  date: string;
  note: string;
}

interface Complaint {
  id: number;
  _id?: string; // Adding this to handle MongoDB's _id field
  date: string;
  student: string;
  rollNo: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  meal: string;
  notes: ComplaintNote[];
}

export default function ComplaintsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  
  // Add states for API data handling
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  // Fetch complaints from API
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/complaints');
        
        // Map the API response to match our Complaint interface
        const formattedComplaints = response.data.map((complaint: any) => ({
          id: complaint._id || complaint.id,
          _id: complaint._id,
          date: new Date(complaint.timestamp || complaint.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          student: complaint.name || complaint.student,
          rollNo: complaint.student_id || complaint.rollNo,
          title: complaint.title || complaint.issue?.substring(0, 50) + '...',
          description: complaint.issue || complaint.description,
          status: complaint.status as ComplaintStatus,
          meal: complaint.meal || 'Not specified',
          notes: complaint.notes || []
        }));
        
        setComplaints(formattedComplaints);
        
        // Calculate stats
        const total = formattedComplaints.length;
        const pending = formattedComplaints.filter(c => c.status === 'pending').length;
        const inProgress = formattedComplaints.filter(c => c.status === 'in-progress').length;
        const resolved = formattedComplaints.filter(c => c.status === 'resolved').length;
        
        setStats({
          total,
          pending,
          inProgress,
          resolved
        });
        
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Failed to load complaints. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(complaint => complaint.status === filter);

  const handleStatusChange = async (complaintId: number, newStatus: ComplaintStatus) => {
    try {
      // Call your API to update the status
      await axios.put(`/api/complaints/${complaintId}`, {
        status: newStatus
      });
      
      // Update local state
      setComplaints(complaints.map(c => 
        c.id === complaintId ? {...c, status: newStatus} : c
      ));
      
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({...selectedComplaint, status: newStatus});
      }
      
      // Recalculate stats
      const total = complaints.length;
      const pending = complaints.filter(c => c.id !== complaintId ? c.status === 'pending' : newStatus === 'pending').length;
      const inProgress = complaints.filter(c => c.id !== complaintId ? c.status === 'in-progress' : newStatus === 'in-progress').length;
      const resolved = complaints.filter(c => c.id !== complaintId ? c.status === 'resolved' : newStatus === 'resolved').length;
      
      setStats({
        total,
        pending,
        inProgress,
        resolved
      });
      
    } catch (err) {
      console.error(`Error updating status for complaint #${complaintId}:`, err);
      setError('Failed to update complaint status. Please try again.');
    } finally {
      setShowStatusDropdown(false);
    }
  };

  const handleAddNote = async (complaintId: number) => {
    if (!adminNote.trim()) return;
    
    try {
      const newNote = {
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        note: adminNote
      };
      
      // Call your API to add the note
      await axios.post(`/api/complaints/${complaintId}/notes`, {
        note: adminNote
      });
      
      // Update local state
      setComplaints(complaints.map(c => 
        c.id === complaintId ? {...c, notes: [...c.notes, newNote]} : c
      ));
      
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({
          ...selectedComplaint, 
          notes: [...selectedComplaint.notes, newNote]
        });
      }
      
      setAdminNote('');
    } catch (err) {
      console.error(`Error adding note to complaint #${complaintId}:`, err);
      setError('Failed to add note. Please try again.');
    }
  };

  const StatusBadge = ({ status }: { status: ComplaintStatus }) => {
    const getStatusStyles = () => {
      switch(status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'in-progress':
          return 'bg-blue-100 text-blue-800';
        case 'resolved':
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 rounded-t-lg flex justify-between items-center p-4 mb-6">
          <h1 className="text-xl font-semibold">Complaints Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              
             
            </div>
          </div>
        </header>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Complaints</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Resolved</div>
            <div className="text-2xl font-semibold text-green-600">{stats.resolved}</div>
          </div>
        </div>
        
        {/* Complaint Details & Management */}
        <div className="grid grid-cols-3 gap-6">
          {/* Complaints List */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Student Complaints</h2>
              
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select 
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Complaints</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                  <p>Loading complaints...</p>
                </div>
              ) : filteredComplaints.length > 0 ? (
                filteredComplaints.map(complaint => (
                  <div 
                    key={complaint.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedComplaint?.id === complaint.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{complaint.title}</h3>
                      <StatusBadge status={complaint.status} />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span>{complaint.date}</span>
                      <span>•</span>
                      <span>Student: {complaint.student}</span>
                      <span>•</span>
                      <span>ID: {complaint.rollNo}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-2 line-clamp-1">{complaint.description}</p>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageSquare size={14} />
                      <span>{complaint.notes.length} notes</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No complaints found with the selected filter.
                </div>
              )}
            </div>
            
            {!loading && complaints.length > 0 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing 1-{Math.min(filteredComplaints.length, complaints.length)} of {filteredComplaints.length} complaints
                </div>
                
                {/* Pagination can be implemented if needed */}
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50" disabled>
                    <ArrowLeft size={16} />
                  </button>
                  
                  <div className="flex items-center">
                    <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
                  </div>
                  
                  <button className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50" disabled>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Complaint Details */}
          <div className="col-span-1">
            {selectedComplaint ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium">Complaint Details</h2>
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                </div>
                
                <div className="p-4 overflow-y-auto flex-grow">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg">{selectedComplaint.title}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <div>Date: {selectedComplaint.date}</div>
                      <div>Student: {selectedComplaint.student}</div>
                      <div>Roll No: {selectedComplaint.rollNo}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-gray-700">{selectedComplaint.description}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Admin Notes</h4>
                    {selectedComplaint.notes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedComplaint.notes.map((note, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">{note.date}</div>
                            <p className="text-gray-700 text-sm">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No notes added yet.</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Add Note</h4>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Add admin note about this complaint..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <div className="flex flex-col space-y-3">
                    <button 
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                      onClick={() => handleAddNote(selectedComplaint.id)}
                    >
                      <MessageSquare size={16} />
                      Add Note
                    </button>
                    
                    <div className="relative">
                      <button 
                        className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-between"
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      >
                        <span>Update Status</span>
                        <ChevronDown size={16} />
                      </button>
                      
                      {showStatusDropdown && (
                        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <div className="py-1">
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={() => handleStatusChange(selectedComplaint.id, 'pending')}
                            >
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              Mark as Pending
                            </button>
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={() => handleStatusChange(selectedComplaint.id, 'in-progress')}
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Mark as In Progress
                            </button>
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                            >
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <Check size={14} />
                              Mark as Resolved
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center p-6">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-1">No Complaint Selected</p>
                  <p>Select a complaint from the list to view details and take action.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}