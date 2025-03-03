import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Award,
  Menu,
  Users,
  MessageSquare,
  ClipboardCheck,
  UserCircle,
  ChevronDown,
  MessagesSquare,
  Trophy, // Added Trophy import
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const navigation: NavItem[] = [
  {
    name: "Trang chủ",
    href: "/",
    icon: Home,
  },
  {
    name: "Gửi lời cảm ơn",
    href: "/thanks",
    icon: MessageSquare,
  },
  {
    name: "Bảng xếp hạng",
    href: "/rankings",
    icon: Trophy,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Duyệt lời cảm ơn",
    href: "/approvals",
    icon: ClipboardCheck,
    roles: ["manager", "admin"],
  },
  {
    name: "Quản lý nhân viên",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    name: "Quản lý lời cảm ơn",
    href: "/admin/thanks",
    icon: MessagesSquare,
    roles: ["admin"],
  },
];

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const filteredNavigation = navigation.filter(
    item => !item.roles || item.roles.includes(user?.role || '')
  );

  const NavLinks = () => (
    <>
      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{user?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Hồ sơ cá nhân
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 font-semibold">
          <Award className="h-6 w-6 text-primary" />
          <span className="hidden md:inline">Recognition Portal</span>
        </div>

        {/* Desktop Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end md:space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <NavLinks />
          </div>
          {user && <UserMenu />}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center ml-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-2 mt-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}