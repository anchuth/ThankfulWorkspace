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

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigation = [
    {
      name: "Home",
      href: "/",
      icon: MessageSquareDiff,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r">
            <div className="flex items-center h-16 px-4 border-b">
              <h1 className="text-xl font-bold">Recognition Portal</h1>
            </div>
            <div className="flex-grow p-4">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          location === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="h-8 w-8 bg-primary/10 rounded-full p-1" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
