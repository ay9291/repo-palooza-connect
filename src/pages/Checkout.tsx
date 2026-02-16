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
import { evaluateCoupon, getShippingAmount, performFraudScreening, validateShippingAddress } from "@/lib/checkout-engine";

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

const DEFAULT_ADDRESS: ShippingAddress = {
  fullName: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
};

const TAX_RATE = 0.18;

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(DEFAULT_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingTier, setShippingTier] = useState("standard");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    const rawDefaultAddress = localStorage.getItem("checkout-default-address");
    const rawSavedAddresses = localStorage.getItem("checkout-saved-addresses");

    if (rawDefaultAddress) {
      try {
        setShippingAddress(JSON.parse(rawDefaultAddress) as ShippingAddress);
      } catch {
        setShippingAddress(DEFAULT_ADDRESS);
      }
    }

    if (rawSavedAddresses) {
      try {
        setSavedAddresses(JSON.parse(rawSavedAddresses) as ShippingAddress[]);
      } catch {
        setSavedAddresses([]);
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
    [cartItems],
  );

  const shippingAmount = useMemo(
    () => getShippingAmount({ subtotal, shippingTier }),
    [shippingTier, subtotal],
  );

  const pricing = calculateCheckoutTotals({
    subtotal,
    discountPercent: subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
    taxRate: TAX_RATE,
    shippingFlat: shippingAmount,
  });

  const taxAmount = pricing.taxAmount;
  const finalTotal = pricing.total;

  const handleApplyCoupon = () => {
    const evaluation = evaluateCoupon(couponCode, subtotal);
    if (!evaluation.ok) {
      toast({ title: "Coupon", description: evaluation.message, variant: "destructive" });
      return;
    }

    setAppliedCoupon(evaluation.code || null);
    setDiscountAmount(evaluation.discountAmount || 0);
    toast({ title: "Coupon applied", description: evaluation.message });
  };

  const saveAddress = () => {
    const validation = validateShippingAddress(shippingAddress);
    if (!validation.ok) {
      toast({ title: "Invalid address", description: validation.message, variant: "destructive" });
      return;
    }

    const next = [...savedAddresses, shippingAddress];
    setSavedAddresses(next);
    localStorage.setItem("checkout-saved-addresses", JSON.stringify(next));
    localStorage.setItem("checkout-default-address", JSON.stringify(shippingAddress));
    toast({ title: "Address saved", description: "Address has been added to your saved addresses." });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateShippingAddress(shippingAddress);
    if (!validation.ok) {
      toast({ title: "Checkout blocked", description: validation.message, variant: "destructive" });
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

    const fraudCheck = performFraudScreening({ subtotal, shippingAddress, paymentMethod });
    if (!fraudCheck.approved) {
      toast({ title: "Manual verification required", description: fraudCheck.message, variant: "destructive" });
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

      toast({
        title: "Order placed",
        description: `Payment: ${paymentMethod.toUpperCase()} · Tier: ${shippingTier} · Order #${orderData.order_number}`,
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
          description="Enterprise checkout with validation, fraud checks, smart discounts, and tiered shipping calculator."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-accent" />
              TLS secured session
            </div>
          }
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {["Address", "Payment", "Review"].map((step, idx) => (
            <div key={step} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <span className="font-semibold">{idx + 1}</span>{step}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <Label>Saved Address</Label>
                      <Select onValueChange={(value) => setShippingAddress(savedAddresses[Number(value)])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a saved address" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((address, index) => (
                            <SelectItem key={`${address.phone}-${index}`} value={String(index)}>
                              {address.fullName} · {address.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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

                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={saveAddress}>Save address</Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Tier</Label>
                    <Select value={shippingTier} onValueChange={setShippingTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose delivery speed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (2-5 days)</SelectItem>
                        <SelectItem value="express">Express (next day where available)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card (recommended)</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
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
                  {appliedCoupon && <p className="text-xs text-emerald-600">Applied: {appliedCoupon}</p>}
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
