import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings, LogOut, User, Library, Heart, Trophy, ChevronRight, Mail, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { PrivateMessaging } from "@/components/messaging/PrivateMessaging";

interface MenuItem {
  label: string;
  value?: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function ProfileDropdown({
  className,
  ...props
}: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  if (!user) return null;

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "My Profile",
      href: "/profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      label: "My Books",
      href: "/my-books",
      icon: <Library className="w-4 h-4" />,
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: <Heart className="w-4 h-4" />,
    },
    {
      label: "Achievements",
      value: "View All",
      href: "/settings#achievements",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleOpenMessages = () => {
    setIsOpen(false);
    setIsMessagingOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavigate = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground font-medium">
                {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 p-0 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50"
        >
          {/* Profile Header */}
          <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
            
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg font-semibold">
                    {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {profile?.username || 'User'}
                    </p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                      Member
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                {/* Decorative indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/20 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Curved separator */}
            <svg
              className="absolute -bottom-px left-0 w-full text-card"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
            >
              <path
                d="M0 8 Q50 0 100 8 L100 8 L0 8 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-0.5">
            {menuItems.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={() => handleNavigate(item.href)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {item.value}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Messages */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={handleOpenMessages}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm font-medium">Messages</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="my-1" />

          {/* Sign Out */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 transition-colors group"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">
                Sign Out
              </span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Private Messaging Dialog */}
      <PrivateMessaging isOpen={isMessagingOpen} onClose={() => setIsMessagingOpen(false)} />
    </div>
  );
}
