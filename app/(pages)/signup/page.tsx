"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//import { useToast } from "@/components/ui/use-toast"
import { toast } from "sonner";
import { useAuth } from "@/app/(pages)/(authenticated)/store/authStore";
import axios from "axios";
import { FirebaseError } from "firebase/app";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //const { toast } = useToast()
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>,
    role: "student" | "admin"
  ) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const department = formData.get("department") as string;
    const fullName = formData.get("fullName") as string;

    const studentData = {
      student_id: username, // Roll number as student_id
      name: fullName,
      email: email, // Use the variable already extracted
      phone: phone, // Use the variable already extracted
      department: department, // Using hostel as department
    };

    try {
      let token: string;
      // Validate passwords match
      if (password !== confirmPassword) {
        toast.error("Passwords don't match", {
          description: "Please make sure your passwords match.",
        });
        setIsLoading(false);
        return;
      }

      if (!username || !password || !fullName || !email) {
        toast.error("Registration failed", {
          description: "Please fill in all required fields",
        });
        return; // Exit early
      }

      console.log("Sending API request with data:", studentData);
      // First, create Firebase user and get the token
      try {
        console.log("About to call signUp with:", email, "and password");
        const authResult = await signUp(email, password);
        const user = authResult.user;
        token = authResult.token;
        console.log("Token received:", token);

        // Rest of your code
      } catch (err) {
        const error = err as FirebaseError;
        console.error("Firebase error:", error.code, error.message);

        // Handle specific Firebase auth errors
        if (error.code === "auth/email-already-in-use") {
          toast.error("Email already in use", {
            description:
              "Please try a different email address or login instead.",
          });
        } else {
          toast.error("Authentication failed", {
            description: error.message,
          });
        }
        setIsLoading(false);
        return;
      }
      // Then use that token to authenticate with your API
      const response = await axios.post("api/students/signup", studentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      // Success handling
      toast.success("Registration successful", {
        description: `Welcome, ${fullName}!`,
      });

      router.push(role === "student" ?"student/dashboard" : "/admin/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("API Error:", error.response?.data);
        toast.error("Registration failed", {
          description: error.response?.data?.message || "Server error occurred",
        });
      } else {
        toast.error("Registration failed", {
          description: "An unexpected error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            College Hostel Mess
          </h1>
          <p className="mt-2 text-gray-600">
            Create your account to access the mess system
          </p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="admin">Mess Handler</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Registration</CardTitle>
                <CardDescription>
                  Create an account to access your mess dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleSignup(e, "student")}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-fullName">Full Name</Label>
                    <Input
                      id="student-fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-username">Roll Number</Label>
                    <Input
                      id="student-username"
                      name="username"
                      placeholder="Enter your roll number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input
                      id="student-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-phone">Phone Number</Label>
                    <Input
                      id="student-phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-department">Department</Label>
                    <Select name="department">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">Computer Science</SelectItem>
                        <SelectItem value="ECE">
                          Electronics & Communication
                        </SelectItem>
                        <SelectItem value="EEE">
                          Electrical Engineering
                        </SelectItem>
                        <SelectItem value="ME">
                          Mechanical Engineering
                        </SelectItem>
                        <SelectItem value="CE">Civil Engineering</SelectItem>                 
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-confirmPassword">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="student-confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-orange-500" disabled={isLoading}>
                    {isLoading ? "Creating account..." : " Create Account"}
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Mess Handler Registration</CardTitle>
                <CardDescription>
                  Create an account to manage the mess system
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleSignup(e, "admin")}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-fullName">Full Name</Label>
                    <Input
                      id="admin-fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      name="username"
                      placeholder="Create a username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-employeeId">Employee ID</Label>
                    <Input
                      id="admin-employeeId"
                      name="employeeId"
                      placeholder="Enter your employee ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-position">Position</Label>
                    <Select name="position">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Mess Manager</SelectItem>
                        <SelectItem value="chef">Head Chef</SelectItem>
                        <SelectItem value="staff">Kitchen Staff</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-confirmPassword">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-orange-500" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
