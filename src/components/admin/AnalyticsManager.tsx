import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, DollarSign, TrendingUp, BookOpen, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EngagementAnalytics } from "./EngagementAnalytics";

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalBooks: number;
  totalCustomers: number;
  revenueByVersion: {
    ebook: number;
    paperback: number;
    hardcover: number;
  };
  topSellingBooks: Array<{
    title: string;
    author: string;
    sales: number;
    revenue: number;
  }>;
}

export const AnalyticsManager = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalBooks: 0,
    totalCustomers: 0,
    revenueByVersion: {
      ebook: 0,
      paperback: 0,
      hardcover: 0,
    },
    topSellingBooks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Total revenue and orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total, status");

      const completedOrders = orders?.filter((o) => o.status === "completed") || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = orders?.length || 0;

      // Total books
      const { count: booksCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      // Total customers
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // Revenue by version
      const { data: purchases } = await supabase
        .from("purchases")
        .select("book_version, price");

      const revenueByVersion = {
        ebook: 0,
        paperback: 0,
        hardcover: 0,
      };

      purchases?.forEach((p) => {
        const version = p.book_version as keyof typeof revenueByVersion;
        if (revenueByVersion[version] !== undefined) {
          revenueByVersion[version] += p.price;
        }
      });

      // Top selling books
      const { data: purchasesByBook } = await supabase
        .from("purchases")
        .select("book_id, book_title, book_author, price");

      const bookSales = new Map<string, { title: string; author: string; sales: number; revenue: number }>();

      purchasesByBook?.forEach((p) => {
        const existing = bookSales.get(p.book_id);
        if (existing) {
          existing.sales += 1;
          existing.revenue += p.price;
        } else {
          bookSales.set(p.book_id, {
            title: p.book_title,
            author: p.book_author,
            sales: 1,
            revenue: p.price,
          });
        }
      });

      const topSellingBooks = Array.from(bookSales.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalBooks: booksCount || 0,
        totalCustomers: customersCount || 0,
        revenueByVersion,
        topSellingBooks,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <Tabs defaultValue="sales" className="space-y-6">
      <TabsList>
        <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
        <TabsTrigger value="engagement">User Engagement</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBooks}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Revenue by Book Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-32 font-medium">E-book</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary h-full"
                    style={{
                      width: `${(analytics.revenueByVersion.ebook / analytics.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="font-semibold">${analytics.revenueByVersion.ebook.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-32 font-medium">Paperback</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-accent h-full"
                    style={{
                      width: `${(analytics.revenueByVersion.paperback / analytics.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="font-semibold">${analytics.revenueByVersion.paperback.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-32 font-medium">Hardcover</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-secondary h-full"
                    style={{
                      width: `${(analytics.revenueByVersion.hardcover / analytics.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="font-semibold">${analytics.revenueByVersion.hardcover.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Books */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topSellingBooks.map((book, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{book.sales} sales</p>
                  <p className="text-sm text-muted-foreground">${book.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {analytics.topSellingBooks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No sales data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
      </TabsContent>

      <TabsContent value="engagement">
        <EngagementAnalytics />
      </TabsContent>
    </Tabs>
  );
};
