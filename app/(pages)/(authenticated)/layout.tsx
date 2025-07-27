"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./store/authStore";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Calendar,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  Users,
  Utensils,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading, logOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine user role - assuming role is stored in user object
  const isAdmin = user?.role === 'admin';
  // For pendingComplaints badge on admin menu
  const [pendingComplaints, setPendingComplaints] = useState(12);
  
  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      toast.error('You must be logged in to access this page');
      router.replace('/login');
    }
    
    // If this is an admin route but user is not admin, redirect
    if (!loading && isAuthenticated && !isAdmin && pathname?.includes('/admin')) {
      toast.error('You do not have permission to access this page');
      router.replace('/dashboard');
    }
    
    // If this is a student route but user is admin, redirect to admin dashboard
    if (!loading && isAuthenticated && isAdmin && !pathname?.includes('/admin')) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, loading, router, pathname, isAdmin]);
  
  const handleSignOut = async () => {
    try {
      await logOut();
      toast.success("Successfully signed out");
      router.push("/login"); // Redirect to login page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out", {
        description: "Please try again",
      });
    }
  };

  // Student navigation items
  const studentNavItems = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Menu",
      href: "/student/menu",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      name: "Complaints",
      href: "/student/complaints",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Meal History",
      href: "/student/history",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Payments",
      href: "/student/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
  ];

  // Admin navigation items
  const adminNavItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    // {
    //   name: "Menu Management",
    //   href: "/admin/menu-management",
    //   icon: <Utensils className="h-5 w-5" />,
    // },
    {
      name: "Complaints",
      href: "/admin/complaints",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: pendingComplaints,
    },
    {
      name: "Attendance",
      href: "/admin/attendance",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Students",
      href: "/admin/students",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  // Select proper nav items based on role
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const SidebarContent = () => (
    <div className="h-full flex flex-col py-4 overflow-y-auto">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Hostel Mess
        </h2>
        <p className="px-4 text-sm text-muted-foreground mb-4">
          {isAdmin ? "Admin Panel" : "Student Panel"}
        </p>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                <span className="ml-2">{item.name}</span>
                {/* {item.badge && (
                  <span className="ml-auto bg-[var(--red-primary)] text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )} */}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={isAdmin ? "/admin/settings" : "/settings"}>
            <Settings className="h-5 w-5" />
            <span className="ml-2">Settings</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-2">Logout</span>
        </Button>
      </div>
    </div>
  );

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--blue-primary)] rounded-full border-t-transparent"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar for larger screens */}
      <div className="hidden md:block fixed top-0 left-0 w-64 h-screen bg-card border-r border-border z-30 mess-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="sm:max-w-xs mess-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main content - with left margin for sidebar */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="bg-card border-b border-border sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
              <div className="md:hidden ml-2 text-xl font-semibold text-[var(--blue-primary)]">
                Hostel Mess
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button className="p-1 relative">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                  <span className="absolute top-0 right-0 bg-[var(--red-primary)] rounded-full w-2 h-2"></span>
                </button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="https://github.com/shadcn.png" 
                          alt="User avatar"
                        />
                        <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    <span className="hidden sm:inline-block font-medium">
                      {user?.name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={isAdmin ? "/admin/profile" : "/profile"}
                      className="cursor-pointer w-full flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={isAdmin ? "/admin/settings" : "/settings"}
                      className="cursor-pointer w-full flex items-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}