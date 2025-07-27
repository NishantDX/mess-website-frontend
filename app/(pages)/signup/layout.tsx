"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../(authenticated)/store/authStore";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if user is actually authenticated (has valid user data)
    // This prevents redirection based on stale auth state
    if (!loading && isAuthenticated && user) {
      toast.info('Already logged in')
      
      // Redirect based on user role
      if (user.role === 'admin') {
        router.replace('/admin/dashboard')
      } else {
        router.replace('/student/dashboard') 
      }
    }
  }, [isAuthenticated, loading, router, user])

  // If still checking authentication status, you could show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render the login page if the user is not authenticated
  return <>{children}</>;
}
