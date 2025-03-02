import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  LogOut,
  MessageSquareDiff,
  User as UserIcon,
} from "lucide-react";
import { Navbar } from "./navbar";

export function Layout({ children }: { children: React.ReactNode }) {
  //const { user, logoutMutation } = useAuth();  // Removed as not used in edited code
  //const [location] = useLocation(); // Removed as not used in edited code

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}