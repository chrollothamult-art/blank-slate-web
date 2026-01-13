import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { BooksProvider } from "@/contexts/BooksContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Header } from "./components/Header";
import { GlobalCartSidebar } from "./components/GlobalCartSidebar";
import Index from "./pages/Index";
import { Forum } from "./pages/Forum";
import { Admin } from "./pages/Admin";
import { AdminAuth } from "./pages/AdminAuth";
import { Auth } from "./pages/Auth";
import { MyBooks } from "./pages/MyBooks";
import { Checkout } from "./pages/Checkout";
import { Settings } from "./pages/Settings";
import EventDetail from "./pages/EventDetail";
import AlmanacCategory from "./pages/AlmanacCategory";
import Wishlist from "./pages/Wishlist";
import Books from "./pages/Books";
import { ChronologyTimeline } from "./components/ChronologyTimeline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <BooksProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background transition-colors duration-300">
                <Header />
                <GlobalCartSidebar />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin-auth" element={<AdminAuth />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/my-books" element={<MyBooks />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/chronology" element={<ChronologyTimeline />} />
                  <Route path="/chronology/:eventId" element={<EventDetail />} />
                  <Route path="/almanac/:categoryId" element={<AlmanacCategory />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </BooksProvider>
        </CartProvider>
      </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
