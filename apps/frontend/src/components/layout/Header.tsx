import { Bell, LogOut, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { Button } from "@/components/ui/button.js";
import { useAuth } from "@/hooks/useAuth.js";
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi.js";
import { getInitials } from "@/lib/utils.js";

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export function Header({ onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });
  const unreadCount = countData?.data?.count ?? 0;

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 sm:px-6 gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={onMenuToggle}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
            H
          </div>
          <span className="font-bold text-foreground hidden sm:block">HisobKit</span>
        </Link>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate("/profile")}>
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user.name}
              </span>
            </div>
          )}

          <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="Sign out">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
