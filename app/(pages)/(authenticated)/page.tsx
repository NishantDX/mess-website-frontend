"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./store/authStore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase/firebaseConfig";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Set up a listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is authenticated, check role and redirect
        if (user?.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/student/dashboard");
        }
      } else {
        // No user is signed in, redirect to login
        router.replace("/login");
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [router, user?.role]);

  // Show loading state
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <h1 className="text-2xl font-semibold text-gray-700">Hostel Mess</h1>
        <p className="text-gray-500">Redirecting to the right place...</p>
      </div>
    </div>
  );
}