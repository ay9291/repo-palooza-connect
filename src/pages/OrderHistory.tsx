import { useCallback, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Calendar, DollarSign, MapPin, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHero from "@/components/layout/PageHero";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string;
  order_items: Array<{
    quantity: number;
    price_at_purchase: number;
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
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price_at_purchase,
            products (
              name,
              image_url
            )
          )
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);
      fetchOrders(user.id);
    };

    checkAuthAndFetch();
  }, [fetchOrders, navigate]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-user-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        () => fetchOrders(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, userId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      processing: "bg-sky-500/15 text-sky-700 border-sky-500/30",
      shipped: "bg-violet-500/15 text-violet-700 border-violet-500/30",
      delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      cancelled: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    };
    return colors[status] || "bg-muted text-foreground";
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
        <PageHero
          title="Order Tracking"
          description="Track status updates in real-time and inspect all item details for each order."
          action={
            <Button variant="outline" size="sm" onClick={() => userId && fetchOrders(userId)}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          }
        />

        {orders.length === 0 ? (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-16 text-center space-y-4">
              <Package className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No orders yet.</p>
              <Button onClick={() => navigate("/shop")}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-semibold">₹{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Shipping Address
                </h3>
                <div className="text-sm text-muted-foreground bg-muted/40 p-4 rounded-lg border">
                  <p className="whitespace-pre-line">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex gap-4 bg-muted/40 border rounded-lg p-3">
                      <img
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm font-semibold">₹{Number(item.price_at_purchase).toLocaleString()} each</p>
                      </div>
                      <div className="text-right font-semibold">
                        ₹{(item.quantity * Number(item.price_at_purchase)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
