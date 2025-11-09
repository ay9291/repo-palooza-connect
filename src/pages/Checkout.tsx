import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products(id, name, price)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data as unknown as CartItem[]);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.phone) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const totalAmount = calculateTotal();

      // Format shipping address as a string
      const formattedAddress = `${shippingAddress.fullName}\n${shippingAddress.street}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\nPhone: ${shippingAddress.phone}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          shipping_address: formattedAddress,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Send order confirmation email
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-email', {
          body: {
            customerEmail: profile?.email || user.email,
            customerName: profile?.full_name || 'Customer',
            orderNumber: orderData.order_number,
            orderId: orderData.id,
            totalAmount: totalAmount,
            shippingAddress: formattedAddress,
            items: cartItems.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        });
        
        if (emailError) {
          console.error('Email function error:', emailError);
        } else {
          console.log('Email sent successfully:', emailResult);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the order if email fails
      }

      toast({
        title: "Order Placed!",
        description: `Your order #${orderData.order_number} has been placed successfully. Check your email for confirmation.`,
      });

      navigate('/');
    } catch (error) {
      console.error('Error placing order:', error);
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
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
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
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        placeholder="123 Main Street, Apt 4B"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Maharashtra"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="400001"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
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
