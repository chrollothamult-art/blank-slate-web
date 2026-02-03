import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBooks } from "@/contexts/BooksContext";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  DollarSign,
  Users,
  TrendingUp,
  LogOut,
  Mail,
  Network,
  User,
  FileText,
  Calendar,
  Shield,
  BarChart3,
  MapPin,
  Scale,
} from "lucide-react";
import { ChronologyManager } from "@/components/ChronologyManager";
import { BookManager } from "@/components/admin/BookManager";
import { AlmanacManager } from "@/components/admin/AlmanacManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { CustomersManager } from "@/components/admin/CustomersManager";
import { AnalyticsManager } from "@/components/admin/AnalyticsManager";
import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { CharacterRelationshipManager } from "@/components/admin/CharacterRelationshipManager";
import { CharactersManager } from "@/components/admin/CharactersManager";
import { SubmissionsManager } from "@/components/admin/SubmissionsManager";
import { ContentScheduler } from "@/components/admin/ContentScheduler";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { LocationsManager } from "@/components/admin/LocationsManager";
import { CharacterStatsManager } from "@/components/admin/CharacterStatsManager";

export const Admin = () => {
  const { books } = useBooks();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBooks: 0,
    monthlyRevenue: 0,
    totalSales: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
  }, []);

  const checkAdminAccess = () => {
    const adminId = localStorage.getItem("admin_id");
    if (!adminId) {
      navigate("/admin-auth");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_email");
    navigate("/admin-auth");
  };

  const fetchStats = async () => {
    // Fetch total books
    const { count: booksCount } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    // Fetch monthly revenue (current month)
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const { data: monthlyOrders } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", firstDay);
    
    const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    // Fetch total sales
    const { count: salesCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Fetch total customers
    const { count: customersCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    setStats({
      totalBooks: booksCount || 0,
      monthlyRevenue,
      totalSales: salesCount || 0,
      totalCustomers: customersCount || 0
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-primary mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your bookstore inventory and sales
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalBooks}</p>
                  <p className="text-sm text-muted-foreground">Total Books</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-success" />
                <div>
                  <p className="text-3xl font-bold">${stats.monthlyRevenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalSales}</p>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                  <p className="text-sm text-muted-foreground">Customers</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="books" className="space-y-8">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="chronology">Chronology</TabsTrigger>
            <TabsTrigger value="almanac">Almanac</TabsTrigger>
            <TabsTrigger value="characters">
              <User className="h-4 w-4 mr-1" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Scale className="h-4 w-4 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="h-4 w-4 mr-1" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="relationships">
              <Network className="h-4 w-4 mr-1" />
              Links
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <FileText className="h-4 w-4 mr-1" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-1" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="scheduler">
              <Calendar className="h-4 w-4 mr-1" />
              Scheduler
            </TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <BookManager />
          </TabsContent>

          <TabsContent value="almanac" className="space-y-6">
            <AlmanacManager />
          </TabsContent>

          <TabsContent value="chronology" className="space-y-6">
            <ChronologyManager />
          </TabsContent>

          <TabsContent value="characters" className="space-y-6">
            <CharactersManager />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <CharacterStatsManager />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationsManager />
          </TabsContent>

          <TabsContent value="relationships" className="space-y-6">
            <CharacterRelationshipManager />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <SubmissionsManager />
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <ModerationQueue />
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <ContentScheduler />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersManager />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomersManager />
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <NewsletterManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;