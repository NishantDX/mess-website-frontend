'use client'
import { Toaster } from "sonner";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth, firebaseConfig } from "../../config/firebase/firebaseConfig";
import { initializeApp } from "firebase/app";
import axios from "axios";
import { useAuth } from "./(authenticated)/store/authStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Firebase once
  initializeApp(firebaseConfig);
  
  // Set base URL for axios
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;
  
  const { restoreUser, loading } = useAuth();
  const router = useRouter();
  // Use a single authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const uid = firebaseUser.uid;
        console.log("User signed in:", uid);
        
        try {
          // Get the token
          const token = await firebaseUser.getIdToken();
          
          // Set it as default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log("Default auth header set with token");
          
          // Update our auth store
          await restoreUser(token);
        } catch (error) {
          console.error("Failed to get token:", error);
          await restoreUser(null);
        }
      } else {
        // User is signed out
        console.log("User signed out - removing auth header");
        
        delete axios.defaults.headers.common['Authorization'];
        
        await restoreUser(null);
        // setTimeout(() => {
        //   router.replace("/login"); 
        // }, 0);
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [restoreUser,router]); // Only depend on restoreUser
  
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}