"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
//import { useToast } from "@/components/ui/use-toast";
import { toast } from 'sonner';
import { login } from "@/config/firebase/auth";
import {useAuth} from "../(authenticated)/store/authStore"
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
//const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {user, logIn, isAuthenticated, loading}=useAuth()
  console.log(isAuthenticated)
  // useEffect(() => {
  //   // Only redirect after auth state is determined (not loading)
  //   if (user) {
  //     toast.info("Already logged in");
  //     router.push("/");
  //   }
  // }, [user]);
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>,
    role: "student" | "admin"
  ) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (username && password) {
        const { user, token } = await logIn(email, password);
        // login(username, role);
        toast.success('Login successful', {
            description: `Welcome back, ${username}!`,
          });
          //console.log(role)
      router.push(role === "student" ? "student/dashboard" : "/admin/dashboard");
        //router.push("/dashboard");
      } else {
        toast.error("Login failed", {
            description: "Please enter valid credentials",
          });
      }
    } catch (error) {
        toast.error("Login failed", {
            description: "An error occurred during login",
          });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">College Hostel Mess</h1>
          <p className="mt-2 text-gray-600">
            Sign in to access your mess dashboard
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
                <CardTitle>Student Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your mess dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleLogin(e, "student")}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-username">Email</Label>
                    <Input
                      id="student-username"
                      name="username"
                      placeholder="Enter your email"
                      required
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-blue-500 hover:bg-orange-600 text-white border-none" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Mess Handler Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access the mess management dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleLogin(e, "admin")}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="student-username">Email</Label>
                    <Input
                      id="student-username"
                      name="username"
                      placeholder="Enter your email"
                      required
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
