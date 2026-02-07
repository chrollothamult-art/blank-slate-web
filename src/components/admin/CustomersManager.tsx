import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  book_title: string;
  book_author: string;
  book_version: string;
  price: number;
  purchased_at: string;
}

export const CustomersManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
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

  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    // Fetch purchases for this customer using the customer id via orders
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, created_at")
        .eq("customer_id", customer.id);
      
      if (error) throw error;
      
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const orderDateMap = new Map(orders.map((o: any) => [o.id, o.created_at]));
        
        const { data: items } = await supabase
          .from("order_items")
          .select(`
            id,
            quantity,
            price,
            version_type,
            order_id,
            books(title, author)
          `)
          .in("order_id", orderIds);
        
        const purchases: Purchase[] = (items || []).map((item: any) => ({
          id: item.id,
          book_title: item.books?.title || "Unknown",
          book_author: item.books?.author || "Unknown",
          book_version: item.version_type,
          price: item.price,
          purchased_at: orderDateMap.get(item.order_id) || new Date().toISOString(),
        }));
        
        setPurchases(purchases);
      } else {
        setPurchases([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setShowDetails(true);
  };

  if (loading) {
    return <div>Loading customers...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.full_name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    {customer.city && customer.country
                      ? `${customer.city}, ${customer.country}`
                      : "-"}
                  </TableCell>
                  <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(customer)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedCustomer?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedCustomer?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedCustomer?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="font-medium">
                  {selectedCustomer && new Date(selectedCustomer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedCustomer?.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {selectedCustomer.address}
                  {selectedCustomer.city && `, ${selectedCustomer.city}`}
                  {selectedCustomer.postal_code && ` ${selectedCustomer.postal_code}`}
                  {selectedCustomer.country && `, ${selectedCustomer.country}`}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Purchase History ({purchases.length})</h4>
              {purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{purchase.book_title}</p>
                            <p className="text-sm text-muted-foreground">{purchase.book_author}</p>
                          </div>
                        </TableCell>
                        <TableCell>{purchase.book_version}</TableCell>
                        <TableCell>${purchase.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(purchase.purchased_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No purchases yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
