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
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
 import LoreChronicles from "./pages/LoreChronicles";
 import CharacterCreator from "./pages/CharacterCreator";
  import StoryPlayer from "./pages/StoryPlayer";
  import SessionPlayer from "./pages/SessionPlayer";
 import CharacterSheet from "./pages/CharacterSheet";
 import CampaignCreator from "./pages/CampaignCreator";
 import CampaignEditor from "./pages/CampaignEditor";
 import CampaignTutorial from "./pages/CampaignTutorial";
 import LoreExpansion from "./pages/LoreExpansion";
 import { CommunityLorePage } from "./components/lore-chronicles/CommunityLorePage";

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
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
       <Route path="/lore-chronicles" element={<PageTransition><LoreChronicles /></PageTransition>} />
       <Route path="/lore-chronicles/create-character" element={<PageTransition><CharacterCreator /></PageTransition>} />
       <Route path="/lore-chronicles/play/:campaignId" element={<PageTransition><SessionPlayer /></PageTransition>} />
       <Route path="/lore-chronicles/session/:sessionId" element={<PageTransition><SessionPlayer /></PageTransition>} />
       <Route path="/lore-chronicles/character/:characterId" element={<PageTransition><CharacterSheet /></PageTransition>} />
       <Route path="/lore-chronicles/create-campaign" element={<PageTransition><CampaignCreator /></PageTransition>} />
       <Route path="/lore-chronicles/edit-campaign/:campaignId" element={<PageTransition><CampaignEditor /></PageTransition>} />
       <Route path="/lore-chronicles/tutorial" element={<PageTransition><CampaignTutorial /></PageTransition>} />
       <Route path="/lore-chronicles/lore-expansion" element={<PageTransition><LoreExpansion /></PageTransition>} />
       <Route path="/lore-chronicles/community-lore" element={<PageTransition><CommunityLorePage /></PageTransition>} />
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
        <ErrorBoundary>
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
                      <ErrorBoundary>
                        <AnimatedRoutes />
                      </ErrorBoundary>
                      <BackToTop />
                    </div>
                  </KeyboardShortcutsProvider>
                </BrowserRouter>
              </BooksProvider>
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
