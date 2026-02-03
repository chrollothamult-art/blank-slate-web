import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/CartSidebar";
import { StreakBadge } from "@/components/StreakBadge";
import { NotificationBell } from "@/components/NotificationBell";
import ProfileDropdown from "@/components/ProfileDropdown";
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import thouartLogo from "@/assets/thouart-logo.png";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems, openCart, isOpen, closeCart, items, updateQuantity, removeFromCart } = useCart();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: "Books", href: "/books", icon: BookOpen },
    { name: "Community", href: "/community", icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={thouartLogo} alt="ThouArt Logo" className="h-10 w-10" />
            <span className="text-2xl font-playfair font-bold text-primary">
              ThouArt
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href) 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Reading Streak Badge - hidden on mobile */}
            <div className="hidden sm:block">
              <StreakBadge size="sm" />
            </div>
            
            {/* Notifications - hidden on mobile, shown in mobile menu */}
            {user && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}
            
            {/* Theme Toggle - hidden on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            {/* User Account - always visible */}
            {user ? (
              <ProfileDropdown />
            ) : (
              <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10" onClick={openCart}>
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs flex items-center justify-center"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* Cart Sidebar */}
            <CartSidebar
              isOpen={isOpen}
              onClose={closeCart}
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
            />

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background py-4 rounded-b-2xl">
            <div className="flex flex-col space-y-4 px-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-10"
                />
              </form>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all rounded-xl ${
                      isActive(item.href) 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile-only Actions */}
              <div className="border-t border-border/50 pt-4 space-y-2">
                {/* Streak Badge */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground">Reading Streak</span>
                  <StreakBadge size="sm" />
                </div>
                
                {/* Notifications */}
                {user && (
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Notifications</span>
                    <NotificationBell />
                  </div>
                )}
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                {/* Sign In for non-logged users */}
                {!user && (
                  <div className="px-4 pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};