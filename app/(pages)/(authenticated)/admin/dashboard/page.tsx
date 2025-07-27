"use client";
import { useState } from "react";
import { Edit, Bell, X } from "lucide-react";
import axios from "axios";

// Import components
import { AttendanceCard } from "@/components/admin/dashboard/attendanceCard";
import { RevenueCard } from "@/components/admin/dashboard/revenueCard";
import { TodayMenuCard } from "@/components/admin/dashboard/todayMenuCard";
import { AnnouncementsCard } from "@/components/admin/dashboard/announcementCard";

export default function AdminDashboard() {
  // State that would typically be fetched from an API
  const [totalStudents, setTotalStudents] = useState(250);
  const [attendanceToday, setAttendanceToday] = useState({
    breakfast: 178,
    lunch: 215,
    dinner: 195,
  });

  const [revenue, setRevenue] = useState({
    today: 35280,
    thisMonth: 452700,
    pending: 125600,
  });

  const [menuItems, setMenuItems] = useState({
    breakfast: ["Dhokla", "Chutney", "Masala Tea"],
    lunch: ["Veg Biryani", "Onion Raita", "Pickle", "Papad"],
    dinner: ["Chapati", "Mix Veg Curry", "Plain Rice", "Buttermilk"],
  });

  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Updated Mess Rates",
      content: "Mess rates will increase by 5% from next month",
      date: "2025-04-24",
    },
    {
      id: 2,
      title: "Special Dinner",
      content: "Special dinner on Saturday - Pav Bhaji & Ice Cream",
      date: "2025-04-25",
    },
  ]);

  // Menu update modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [updatedMenu, setUpdatedMenu] = useState({
    day: "",
    breakfast: "",
    lunch: "",
    dinner: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // Announcement modal state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: "",
  });
  const [isAnnouncementSubmitting, setIsAnnouncementSubmitting] =
    useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [announcementSuccess, setAnnouncementSuccess] = useState("");

  // Handlers
  const handleEditMenu = (meal: string, items: string[]) => {
    console.log(`Editing ${meal} menu`, items);
    // This would open a modal in a real application
  };

  const handleAddAnnouncement = () => {
    console.log("Adding new announcement");
    // This would open a modal in a real application
  };

  const handleUpdateMenu = () => {
    // Get current day of the week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];

    // Initialize the modal with current menu data
    setUpdatedMenu({
      day: today,
      breakfast: menuItems.breakfast.join(", "),
      lunch: menuItems.lunch.join(", "),
      dinner: menuItems.dinner.join(", "),
    });

    setUpdateError("");
    setUpdateSuccess("");
    setIsMenuModalOpen(true);
  };

  const handleMenuInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setUpdatedMenu((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitMenuUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      // Send POST request to update menu
      const response = await axios.post("/api/menu", updatedMenu);

      // Update local state with new menu
      const newMenuItems = {
        breakfast: updatedMenu.breakfast.split(",").map((item) => item.trim()),
        lunch: updatedMenu.lunch.split(",").map((item) => item.trim()),
        dinner: updatedMenu.dinner.split(",").map((item) => item.trim()),
      };

      setMenuItems(newMenuItems);
      setUpdateSuccess("Menu updated successfully!");

      // Close modal after a delay
      setTimeout(() => {
        setIsMenuModalOpen(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating menu:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object" &&
        (error as { response?: { data?: unknown } }).response !== null
      ) {
        const response = (error as { response?: { data?: unknown } }).response;
        if (
          response &&
          "data" in response &&
          typeof response.data === "object" &&
          response.data !== null &&
          "message" in response.data
        ) {
          const message = (response.data as { message?: unknown }).message;
          setUpdateError(
            (typeof message === "string" && message) ||
              "Failed to update menu. Please try again."
          );
          return;
        }
      }
      setUpdateError("Failed to update menu. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnnouncement = () => {
    setNewAnnouncement({
      title: "",
      description: "",
    });
    setAnnouncementError("");
    setAnnouncementSuccess("");
    setIsAnnouncementModalOpen(true);
  };

  const handleAnnouncementInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnnouncementSubmitting(true);
    setAnnouncementError("");
    setAnnouncementSuccess("");

    try {
      // Send POST request to create announcement
      const response = await axios.post("/api/announcements/", {
        title: newAnnouncement.title,
        description: newAnnouncement.description,
      });

      // Update local state with new announcement
      const createdAnnouncement = response.data.announcement || {
        id: Date.now(), // Fallback ID if not provided by API
        title: newAnnouncement.title,
        content: newAnnouncement.description,
        date: new Date().toISOString().split("T")[0],
      };

      // Add new announcement to the list
      setAnnouncements((prev) => [
        {
          id: createdAnnouncement.id,
          title: createdAnnouncement.title,
          content: createdAnnouncement.description,
          date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);

      setAnnouncementSuccess("Announcement sent successfully!");

      // Close modal after a delay
      setTimeout(() => {
        setIsAnnouncementModalOpen(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error sending announcement:", error);
      // Type guard for Axios error with message
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object" &&
        (error as { response?: { data?: unknown } }).response !== null
      ) {
        const response = (error as { response?: { data?: unknown } }).response;
        if (
          response &&
          "data" in response &&
          typeof response.data === "object" &&
          response.data !== null &&
          "message" in response.data
        ) {
          const message = (response.data as { message?: unknown }).message;
          setAnnouncementError(
            (typeof message === "string" && message) ||
              "Failed to send announcement. Please try again."
          );
          return;
        }
      }
      setAnnouncementError("Failed to send announcement. Please try again.");
    } finally {
      setIsAnnouncementSubmitting(false);
    }
  };

  const handleViewReports = () => {
    console.log("Redirecting to payment reports");
    // This would navigate to the payment reports page
  };

  return (
    <div>
      {/* Dashboard Content */}
      <div className="mess-section">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <AttendanceCard />

          <RevenueCard />

          {/* Quick Actions Card (inline) */}
          <div className="mess-card">
            <h3 className="mess-text-muted mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                className="mess-btn mess-btn-primary mess-action-btn"
                onClick={handleUpdateMenu}
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Today&apos;s Menu
              </button>
              <button
                className="mess-btn mess-btn-outline mess-action-btn"
                onClick={handleSendAnnouncement}
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Announcement
              </button>
              <button
                className="mess-btn mess-btn-outline mess-action-btn"
                onClick={handleViewReports}
              >
                <Edit className="w-4 h-4 mr-2" />
                View Payment Reports
              </button>
            </div>
          </div>
        </div>

        {/* Menu Management */}
        <TodayMenuCard />

        {/* Announcements */}
        <AnnouncementsCard />
      </div>

      {/* Menu Update Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">Update Menu</h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMenuUpdate} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    name="day"
                    value={updatedMenu.day}
                    onChange={handleMenuInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select a day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breakfast (comma separated)
                  </label>
                  <input
                    type="text"
                    name="breakfast"
                    value={updatedMenu.breakfast}
                    onChange={handleMenuInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Poha, Tea, Fruits"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lunch (comma separated)
                  </label>
                  <input
                    type="text"
                    name="lunch"
                    value={updatedMenu.lunch}
                    onChange={handleMenuInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Rice, Dal, Sabzi, Roti"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dinner (comma separated)
                  </label>
                  <input
                    type="text"
                    name="dinner"
                    value={updatedMenu.dinner}
                    onChange={handleMenuInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Roti, Sabzi, Rice, Dessert"
                    required
                  />
                </div>

                {updateError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
                    {updateError}
                  </div>
                )}

                {updateSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded border border-green-200">
                    {updateSuccess}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Menu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">Send Announcement</h3>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnnouncement} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newAnnouncement.title}
                    onChange={handleAnnouncementInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Special Menu This Weekend"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Announcement Description
                  </label>
                  <textarea
                    name="description"
                    value={newAnnouncement.description}
                    onChange={handleAnnouncementInputChange}
                    className="w-full p-2 border rounded min-h-[120px]"
                    placeholder="Enter the details of your announcement here..."
                    required
                  />
                </div>

                {announcementError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
                    {announcementError}
                  </div>
                )}

                {announcementSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded border border-green-200">
                    {announcementSuccess}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  disabled={isAnnouncementSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                  disabled={isAnnouncementSubmitting}
                >
                  {isAnnouncementSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Announcement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
