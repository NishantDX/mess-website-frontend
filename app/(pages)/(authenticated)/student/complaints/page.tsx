"use client";
import ComplaintDetailsModal from "@/components/complaints/viewDetails";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCommentSlash,
  faSignOutAlt,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../../store/authStore";

// Updated type definition to match API response
interface Complaint {
  _id?: string; // MongoDB typically uses _id
  issue: string; // Description of the complaint
  name: string; // Student name
  student_id: string; // Student ID
  status: "pending" | "resolved"; // Status (lowercase in API)
  timestamp: string; // ISO timestamp
  resolutionNote?: string; // Optional resolution notes
}

interface User {
  id: string;
  name: string;
  studentId: string;
  profileImage: string;
}

export default function ComplaintsPage() {
  const currentUser: User = {
    id: "1",
    name: "Nishant Yadav",
    studentId: "231220041",
    profileImage: "/profile-image.jpg",
  };

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    issue: "",
  });
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Function to toggle issue expansion
  const toggleIssueExpansion = (id: string) => {
    setExpandedIssues((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  // Fetch all complaints and user complaints
  useEffect(() => {
    const fetchAllComplaints = async () => {
      try {
        setLoadingAll(true);
        const response = await axios.get("/api/complaints");
        setComplaints(response.data);
        console.log("All complaints:", response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching all complaints:", err);
        setError("Failed to load complaints. Please try again later.");
      } finally {
        setLoadingAll(false);
      }
    };

    const fetchUserComplaints = async () => {
      try {
        setLoadingUser(true);
        const response = await axios.get(
          `/api/complaints/${currentUser.studentId}`
        );
        setUserComplaints(response.data);
        console.log("User complaints:", response.data);
      } catch (err) {
        console.error(
          `Error fetching complaints for user ${currentUser.studentId}:`,
          err
        );
        // Don't set error here to avoid overriding the all complaints error
      } finally {
        setLoadingUser(false);
      }
    };

    fetchAllComplaints();
    fetchUserComplaints();
  }, [currentUser.studentId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewComplaint((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create the new complaint payload matching the API format
      const complaintData = {
        issue: newComplaint.issue,
        name: currentUser.name,
        student_id: currentUser.studentId,
        status: "pending", // New complaints are always pending
        timestamp: new Date().toISOString(), // Current timestamp
        resolutionNote: "", // Empty initially
      };

      // Submit the complaint to the API
      const response = await axios.post("/api/complaints", complaintData);

      // Update both complaints lists with the new complaint
      const newComplaintWithDetails = response.data;
      setComplaints((prev) => [newComplaintWithDetails, ...prev]);
      setUserComplaints((prev) => [newComplaintWithDetails, ...prev]);

      // Reset form and close modal
      setNewComplaint({ issue: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      alert("Failed to submit complaint. Please try again.");
    }
  };

  const handleViewDetails = (complaintId: string) => {
    const complaint = [...complaints, ...userComplaints].find(
      (c) => c._id === complaintId
    );
    if (complaint) {
      setSelectedComplaint(complaint);
      setIsDetailsModalOpen(true);
    }
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Complaints</h2>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5">
          <div className="flex">
            <div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Your Complaints Section */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">Your Complaints</div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center text-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> New Complaint
          </button>
        </div>

        {loadingUser ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-4xl mb-4 text-blue-500"
            />
            <p>Loading your complaints...</p>
          </div>
        ) : userComplaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Issue</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userComplaints.map((complaint) => (
                  <tr key={complaint._id} className="border-b border-gray-100">
                    <td className="py-3 px-3">
                      {formatDate(complaint.timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="relative">
                        {expandedIssues[complaint._id || ""] ? (
                          <>
                            {complaint.issue}
                            <button
                              onClick={() =>
                                toggleIssueExpansion(complaint._id || "")
                              }
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Show Less
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="block max-w-[500px] truncate">
                              {complaint.issue}
                            </span>
                            {complaint.issue.length > 40 &&
                              complaint.issue.length > 500 && (
                                <button
                                  onClick={() =>
                                    toggleIssueExpansion(complaint._id || "")
                                  }
                                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Show More
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-medium ${
                          complaint.status === "resolved"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {complaint.status.charAt(0).toUpperCase() +
                          complaint.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleViewDetails(complaint._id || "")}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FontAwesomeIcon
              icon={faCommentSlash}
              className="text-4xl mb-4 text-gray-400"
            />
            <p>You haven&apos;t submitted any complaints yet.</p>
          </div>
        )}
      </div>

      {/* All Complaints Section */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">All Complaints</div>
        </div>

        {loadingAll ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-4xl mb-4 text-blue-500"
            />
            <p>Loading all complaints...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Student ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Issue</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id} className="border-b border-gray-100">
                    <td className="py-3 px-3">{complaint.name}</td>
                    <td className="py-3 px-3">{complaint.student_id}</td>
                    <td className="py-3 px-3">
                      {formatDate(complaint.timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="relative">
                        {expandedIssues[complaint._id || ""] ? (
                          <>
                            {complaint.issue}
                            <button
                              onClick={() =>
                                toggleIssueExpansion(complaint._id || "")
                              }
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Show Less
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="block max-w-[400px] truncate">
                              {complaint.issue}
                            </span>
                            {complaint.issue.length > 40 &&
                              complaint.issue.length > 400 && (
                                <button
                                  onClick={() =>
                                    toggleIssueExpansion(complaint._id || "")
                                  }
                                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Show More
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-medium ${
                          complaint.status === "resolved"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {complaint.status.charAt(0).toUpperCase() +
                          complaint.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleViewDetails(complaint._id || "")}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Complaint Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
              <h3 className="font-medium">Submit New Complaint</h3>
              <button
                className="text-2xl text-gray-500"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitComplaint}>
              <div className="px-5 py-4">
                <div className="mb-4">
                  <label
                    htmlFor="issue"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Describe Your Issue
                  </label>
                  <textarea
                    id="issue"
                    name="issue"
                    value={newComplaint.issue}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Please provide details about your complaint..."
                    required
                  ></textarea>
                </div>
                <p className="text-sm text-gray-500">
                  Your complaint will be reviewed by the mess management team.
                </p>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isDetailsModalOpen && (
        <ComplaintDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          complaint={selectedComplaint}
          isAdmin={user?.role === "admin"} // Modify based on your actual role system
        />
      )}
    </div>
  );
}
