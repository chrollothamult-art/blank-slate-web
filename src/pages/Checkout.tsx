import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { usePaystackPayment } from "react-paystack";

interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  version: "ebook" | "paperback" | "hardcover";
  cover?: string;
}

export const Checkout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartContextItems, clearCart } = useCart();
  
  // Use cart context items directly for real-time sync
  const cartItems = cartContextItems as CartItem[];

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { state: { returnTo: "/checkout" } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cart is Empty</h2>
            <p className="text-muted-foreground mb-4">Add items to your cart before checkout</p>
            <Button onClick={() => navigate("/")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSuccess = async (reference: any) => {
    setProcessing(true);

    try {
      // Create or get customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            postal_code: formData.postalCode,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Generate order number (use reference from payment)
      const orderNumber = reference.reference;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          order_number: orderNumber,
          subtotal,
          tax: 0,
          total,
          status: "completed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and purchases
      for (const item of cartItems) {
        // Extract the actual book UUID (remove version suffix if present)
        const bookId = item.id.split('-').slice(0, 5).join('-');
        
        // Insert order item
        const { error: orderItemError } = await supabase.from("order_items").insert({
          order_id: order.id,
          book_id: bookId,
          quantity: item.quantity,
          price: item.price,
          version_type: item.version,
        });

        if (orderItemError) {
          console.error("Order item error:", orderItemError);
          throw orderItemError;
        }

        // Get book details for purchase
        const { data: book } = await supabase
          .from("books")
          .select("title, author, cover_image_url")
          .eq("id", bookId)
          .single();

        // Create purchase record for each quantity
        for (let i = 0; i < item.quantity; i++) {
          const { error: purchaseError } = await supabase.from("purchases").insert({
            user_id: user.id,
            book_id: bookId,
            price: item.price,
            book_title: book?.title || item.title,
            book_author: book?.author || item.author,
            book_cover_url: book?.cover_image_url || item.cover,
            book_version: item.version,
          });

          if (purchaseError) {
            console.error("Purchase error:", purchaseError);
            throw purchaseError;
          }
        }
      }

      toast({
        title: "Payment Successful!",
        description: `Your order has been completed. Reference: ${reference.reference}`,
      });

      navigate("/my-books");
    } catch (error: any) {
      console.error("Checkout error:", error);
      
      // Record failed order
      try {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        let customerId = existingCustomer?.id;

        if (!customerId) {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              user_id: user.id,
              email: formData.email,
              full_name: formData.fullName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              country: formData.country,
              postal_code: formData.postalCode,
            })
            .select()
            .single();

          if (newCustomer) customerId = newCustomer.id;
        }

        if (customerId) {
          const orderNumber = `ORD-FAILED-${Date.now()}`;
          await supabase.from("orders").insert({
            customer_id: customerId,
            order_number: orderNumber,
            subtotal,
            tax: 0,
            total,
            status: "failed",
          });
        }
      } catch (recordError) {
        console.error("Error recording failed order:", recordError);
      }

      toast({
        title: "Order Failed",
        description: error.message || "An error occurred while processing your order",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const onClose = async () => {
    try {
      // Create or get customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            postal_code: formData.postalCode,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create cancelled order
      const orderNumber = `ORD-CANCELLED-${Date.now()}`;
      await supabase.from("orders").insert({
        customer_id: customerId,
        order_number: orderNumber,
        subtotal,
        tax: 0,
        total,
        status: "cancelled",
      });

      // Create order items (but no purchases)
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .single();

      if (order) {
        for (const item of cartItems) {
          const bookId = item.id.split('-').slice(0, 5).join('-');
          await supabase.from("order_items").insert({
            order_id: order.id,
            book_id: bookId,
            quantity: item.quantity,
            price: item.price,
            version_type: item.version,
          });
        }
      }
    } catch (error) {
      console.error("Error recording cancelled order:", error);
    }

    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment process",
    });
  };

  // Paystack configuration
  
  // Example: total price is in USD (user sees this)
const priceUSD = total;

// You can fetch a live exchange rate or define your own
const usdToGhsRate = 11.0; // Example: 1 USD = 15 GHS

// Convert USD → GHS for Paystack
const amountInGHS = Math.round(priceUSD * usdToGhsRate * 100); // Paystack uses pesewas

const paystackConfig = {
  reference: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: formData.email,
  amount: amountInGHS, // GHS equivalent, multiplied by 100
  publicKey: "pk_test_6f642162c7fa968894f117624d5a95cca9590fe9",
  currency: "GHS", // actual currency to be charged
  metadata: {
    display_currency: "USD",
    display_amount: priceUSD.toFixed(2),
    custom_fields: [
      { display_name: "Full Name", variable_name: "full_name", value: formData.fullName },
      { display_name: "Phone", variable_name: "phone", value: formData.phone },
      { display_name: "Address", variable_name: "address", value: formData.address },
      { display_name: "City", variable_name: "city", value: formData.city },
      { display_name: "Country", variable_name: "country", value: formData.country },
      { display_name: "Postal Code", variable_name: "postal_code", value: formData.postalCode },
    ],
    cart_items: cartItems.map(item => ({
      id: item.id,
      title: item.title,
      version: item.version,
      quantity: item.quantity,
      price_usd: item.price,
    })),
  },
};


  const initializePayment = usePaystackPayment(paystackConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before opening payment
    if (!formData.fullName || !formData.email || !formData.address || 
        !formData.city || !formData.country || !formData.postalCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping information",
        variant: "destructive",
      });
      return;
    }

    // Open Paystack payment popup
    initializePayment({ onSuccess, onClose } as any);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full btn-professional"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.version}`} className="flex gap-3">
                        <div className="w-12 h-16 bg-muted rounded flex-shrink-0">
                          {item.cover && (
                            <img
                              src={item.cover}
                              alt={item.title}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.version}</p>
                          <p className="text-sm">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                  
                      <span>You will be charged the equivalent of ${total.toFixed(2)} in GHS</span>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
