"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../store/authStore"; // Adjust path as needed
import axios from "axios";
import Script from "next/script";
import { format } from "date-fns";
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}
interface RazorpayInstance {
  open: () => void;
}
export {};

// Define your payment history interface
interface PaymentHistory {
  _id: string;
  payment_id: string; // If this is the actual property name in the API response
  amount: number;
  timestamp: string;
  status: string;
  student_id: string;
}
const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
export default function Payments() {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { user } = useAuth();
  const studentId = user?.student_id;

  // Constants for payment calculation
  const totalMeals = 42;
  const mealRate = 60;
  const totalDue = totalMeals * mealRate;

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        setScriptLoaded(true);
      };

      script.onerror = () => {
        setError("Failed to load payment system. Please try again later.");
      };

      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  // Function to fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    if (!studentId) return;

    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`/api/payments/history/${studentId}`);
      setPaymentHistory(response.data);
    } catch (err) {
      console.error("Error fetching payment history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [studentId]);

  // Fetch payment history on component mount
  useEffect(() => {
    if (studentId) {
      fetchPaymentHistory();
    }
  }, [studentId, fetchPaymentHistory]);

  const handlePayNow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!scriptLoaded) {
        setError("Payment system is loading. Please try again.");
        return;
      }

      if (!studentId) {
        setError("You need to be logged in to make a payment.");
        return;
      }

      // Create an order with your backend
      const orderResponse = await axios.post("/api/payments/create-order", {
        amount: totalDue,
        student_id: studentId,
      });

      const { orderId, amount, currency } = orderResponse.data;

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      // Initialize Razorpay payment
     const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: amount,
        currency: currency,
        name: "Hostel Mess",
        description: `Mess Fee - ${totalMeals} meals`,
        order_id: orderId,
        handler: async function (response: RazorpayHandlerResponse) {
          try {
            await axios.post("/api/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              student_id: studentId,
              amount: totalDue,
            });

            alert("Payment successful!");
            fetchPaymentHistory();
          } catch (error) {
            console.error("Payment verification failed:", error);
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: unknown) {
      console.error("Payment error:", error);
      let message = "Payment failed. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        message = (error as { message: string }).message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError("Failed to load payment system")}
      />

      <div className="px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="mess-heading-lg">Payments</h1>
        </div>

        {error && (
          <div className="mb-6 bg-[var(--red-light)] border-l-4 border-[var(--red-primary)] p-4 text-[var(--red-primary)]">
            {error}
          </div>
        )}

        <div className="mess-card mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="mess-heading-md">Payment Summary</h2>
          </div>
          <div className="p-6 bg-muted">
            <div className="flex justify-between mb-3">
              <span className="text-foreground">Current Due</span>
              <span className="font-medium">₹{totalDue}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-foreground">Total Meals (This Month)</span>
              <span className="font-medium">{totalMeals}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-foreground">Meal Rate</span>
              <span className="font-medium">₹{mealRate} per meal</span>
            </div>
            <div className="flex justify-between pt-4 mt-4 border-t border-border font-semibold">
              <span>Total Amount Due</span>
              <span>₹{totalDue}</span>
            </div>
          </div>
          <div className="px-6 py-4">
            <button
              onClick={handlePayNow}
              disabled={isLoading || !scriptLoaded || !studentId}
              className={`w-full mess-btn ${
                isLoading || !scriptLoaded || !studentId
                  ? "bg-muted-foreground cursor-not-allowed"
                  : "mess-btn-primary"
              }`}
            >
              {isLoading ? "Processing..." : "Pay Now with Razorpay"}
            </button>
          </div>
        </div>

        <div className="mess-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="mess-heading-md">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue-primary)]"></div>
              </div>
            ) : paymentHistory.length > 0 ? (
              <table className="mess-table">
                <thead className="mess-table-header">
                  <tr>
                    <th className="mess-table-header-cell">Transaction ID</th>
                    <th className="mess-table-header-cell">Date</th>
                    <th className="mess-table-header-cell">Amount</th>
                    <th className="mess-table-header-cell">Description</th>
                    <th className="mess-table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment._id} className="mess-table-row">
                      <td className="mess-table-cell">
                        {payment.payment_id
                          ? payment.payment_id.substring(0, 8) + "..."
                          : "N/A"}
                      </td>
                      <td className="mess-table-cell">
                        {formatDate(payment.timestamp)}
                      </td>
                      <td className="mess-table-cell">₹{payment.amount}</td>
                      <td className="mess-table-cell">Mess Fee Payment</td>
                      <td className="mess-table-cell">
                        <span className="mess-badge mess-badge-green">
                          {payment.status === "success"
                            ? "Paid"
                            : payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 mess-text-muted">
                No payment history found.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
