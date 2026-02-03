import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { BooksProvider } from "@/contexts/BooksContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Header } from "./components/Header";
import { PageTransition } from "./components/PageTransition";
import { ScrollToTop } from "./components/ScrollToTop";
import { NavigationProgress } from "./components/NavigationProgress";
import { BackToTop } from "./components/BackToTop";
import { KeyboardShortcutsProvider } from "./components/KeyboardShortcutsProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { Admin } from "./pages/Admin";
import { AdminAuth } from "./pages/AdminAuth";
import { Auth } from "./pages/Auth";
import { MyBooks } from "./pages/MyBooks";
import { Checkout } from "./pages/Checkout";
import { Settings } from "./pages/Settings";
import ProfilePage from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import AlmanacCategory from "./pages/AlmanacCategory";
import Wishlist from "./pages/Wishlist";
import Books from "./pages/Books";
import RelationshipsMap from "./pages/RelationshipsMap";
import { ChronologyTimeline } from "./components/ChronologyTimeline";
import Community from "./pages/Community";
import SubmissionDetail from "./pages/SubmissionDetail";
import BookClubDetail from "./pages/BookClubDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/profile/:userId" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/forum" element={<Navigate to="/community" replace />} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/admin-auth" element={<PageTransition><AdminAuth /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/my-books" element={<PageTransition><MyBooks /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
        <Route path="/books" element={<PageTransition><Books /></PageTransition>} />
        <Route path="/chronology" element={<PageTransition><ChronologyTimeline /></PageTransition>} />
        <Route path="/chronology/:eventId" element={<PageTransition><EventDetail /></PageTransition>} />
        <Route path="/almanac/:categoryId" element={<PageTransition><AlmanacCategory /></PageTransition>} />
        <Route path="/relationships" element={<PageTransition><RelationshipsMap /></PageTransition>} />
        <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
        <Route path="/community/submission/:id" element={<PageTransition><SubmissionDetail /></PageTransition>} />
        <Route path="/community/club/:clubId" element={<PageTransition><BookClubDetail /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

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
                <ScrollToTop />
                <NavigationProgress />
                <KeyboardShortcutsProvider>
                  <div className="min-h-screen bg-background transition-colors duration-300">
                    <Header />
                    <AnimatedRoutes />
                    <BackToTop />
                  </div>
                </KeyboardShortcutsProvider>
              </BrowserRouter>
            </BooksProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
