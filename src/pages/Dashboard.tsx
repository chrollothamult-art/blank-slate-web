import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentBooksProgress } from "@/components/dashboard/RecentBooksProgress";
import { DashboardAchievements } from "@/components/dashboard/DashboardAchievements";
import { DashboardStreak } from "@/components/dashboard/DashboardStreak";
import { DashboardActivity } from "@/components/dashboard/DashboardActivity";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Your Reading Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your progress, achievements, and reading journey
            </p>
          </div>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Left Column - Books Progress */}
            <div className="lg:col-span-2 space-y-6">
              <RecentBooksProgress />
            </div>

            {/* Right Column - Streak & Achievements */}
            <div className="space-y-6">
              <DashboardStreak />
              <DashboardAchievements />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="mt-8">
            <DashboardActivity />
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
