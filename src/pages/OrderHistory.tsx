import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Calendar, DollarSign, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: any;
  order_items: Array<{
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string | null;
    };
  }>;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders(user.id);
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Package className="w-8 h-8 text-accent" />
            Order History
          </h1>
          <p className="text-muted-foreground">
            Track and view your orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              No orders yet
            </p>
            <Button asChild>
              <a href="/shop">Start Shopping</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="font-semibold">
                        ₹{Number(order.total_amount).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h3>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  <p>{selectedOrder.shipping_address.full_name}</p>
                  <p>{selectedOrder.shipping_address.address}</p>
                  <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}</p>
                  <p>{selectedOrder.shipping_address.phone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex gap-4 bg-muted p-3 rounded-lg">
                      <img
                        src={item.products.image_url || '/placeholder.svg'}
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold">
                          ₹{Number(item.price).toLocaleString()} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{(item.quantity * Number(item.price)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
