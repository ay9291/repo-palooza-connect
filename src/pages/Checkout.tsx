import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHero from "@/components/layout/PageHero";
import { calculateCheckoutTotals } from "@/lib/checkout-pricing";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

const COUPONS: Record<string, number> = {
  WELCOME10: 10,
  SAVE5: 5,
};

const SHIPPING_FLAT = 149;
const TAX_RATE = 0.18;

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    const saved = localStorage.getItem("checkout-default-address");
    if (saved) {
      try {
        setShippingAddress(JSON.parse(saved) as ShippingAddress);
      } catch {
        // ignore malformed local storage data
      }
    }
  }, []);

  const fetchCart = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product:products(id, name, price)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data as unknown as CartItem[]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const discountPercent = appliedCoupon ? COUPONS[appliedCoupon] || 0 : 0;
  const pricing = calculateCheckoutTotals({
    subtotal,
    discountPercent,
    taxRate: TAX_RATE,
    shippingFlat: cartItems.length > 0 ? SHIPPING_FLAT : 0,
  });
  const discountAmount = pricing.discountAmount;
  const taxAmount = pricing.taxAmount;
  const shippingAmount = pricing.shippingAmount;
  const finalTotal = pricing.total;

  const handleApplyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      toast({ title: "Coupon", description: "Enter a coupon code first." });
      return;
    }

    if (!COUPONS[normalized]) {
      toast({ title: "Invalid coupon", description: "This coupon is not valid.", variant: "destructive" });
      return;
    }

    setAppliedCoupon(normalized);
    toast({ title: "Coupon applied", description: `${COUPONS[normalized]}% discount has been applied.` });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.values(shippingAddress).some((val) => !val.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all shipping address fields",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      localStorage.setItem("checkout-default-address", JSON.stringify(shippingAddress));

      const formattedAddress = `${shippingAddress.fullName}\n${shippingAddress.street}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\nPhone: ${shippingAddress.phone}`;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: Number(finalTotal.toFixed(2)),
          shipping_address: formattedAddress,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      const { error: deleteError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (deleteError) throw deleteError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      try {
        await supabase.functions.invoke("send-order-email", {
          body: {
            customerEmail: profile?.email || user.email,
            customerName: profile?.full_name || "Customer",
            orderNumber: orderData.order_number,
            orderId: orderData.id,
            totalAmount: Number(finalTotal.toFixed(2)),
            shippingAddress: formattedAddress,
            items: cartItems.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        });
      } catch {
        // Do not fail checkout for email dispatch issues
      }

      toast({
        title: "Order placed",
        description: `Payment: ${paymentMethod.toUpperCase()} · Order #${orderData.order_number}`,
      });

      navigate("/orders");
    } catch {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <PageHero
          title="Secure Checkout"
          description="Fast checkout with transparent tax, shipping, discounts, and secure payment preference selection."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-accent" />
              TLS secured session
            </div>
          }
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" value={shippingAddress.fullName} onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })} required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input id="street" value={shippingAddress.street} onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input id="zipCode" value={shippingAddress.zipCode} onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                        <SelectItem value="upi">UPI (collect on dispatch)</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                      <span className="font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <Label htmlFor="coupon">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input id="coupon" placeholder="WELCOME10" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <Button type="button" variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                  {appliedCoupon && <p className="text-xs text-emerald-600">Applied: {appliedCoupon} ({discountPercent}% off)</p>}
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>-₹{discountAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Tax (18%)</span><span>₹{taxAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>₹{shippingAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
