import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, Package2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    name: string;
    slug: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  user_id: string;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  order_items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          status,
          total_amount,
          shipping_address,
          user_id,
          profiles(full_name, email),
          order_items(
            id,
            quantity,
            price_at_purchase,
            products(name, slug, image_url)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: Record<string, string | null> = { status: newStatus };
      if (newStatus === "cancelled") {
        updateData.cancelled_by = "admin";
        updateData.cancellation_reason = null;
      }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
      if (error) throw error;

      toast({ title: "Success", description: "Order status updated" });
      loadOrders();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      processing: "bg-sky-500/15 text-sky-600 border-sky-500/30",
      shipped: "bg-violet-500/15 text-violet-600 border-violet-500/30",
      delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      cancelled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    };
    return colors[status] || "bg-muted text-foreground border-border";
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const query = searchQuery.toLowerCase();
        return (
          order.order_number?.toLowerCase().includes(query) ||
          order.profiles?.email?.toLowerCase().includes(query) ||
          order.profiles?.full_name?.toLowerCase().includes(query)
        );
      }),
    [orders, searchQuery]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-accent/5 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
        <p className="text-muted-foreground">Track orders, review line-items, and update fulfillment status.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">All Orders</CardTitle>
            <Badge variant="outline">{filteredOrders.length} results</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by order #, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <Collapsible
                    key={order.id}
                    open={expandedOrder === order.id}
                    onOpenChange={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    asChild
                  >
                    <>
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {expandedOrder === order.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            #{order.order_number || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserRound className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{order.profiles?.full_name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{order.profiles?.email || "N/A"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {order.total_amount > 0 ? `₹${Number(order.total_amount).toLocaleString()}` : "Bulk Order"}
                        </TableCell>
                        <TableCell>{order.order_items?.length || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <select
                            className="text-sm border rounded px-2 py-1 bg-background"
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </TableCell>
                      </TableRow>

                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 border-l-4 border-l-primary">
                            <div className="py-4 space-y-4">
                              <div>
                                <p className="font-semibold text-sm mb-1">Shipping Address</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{order.shipping_address}</p>
                              </div>

                              <div>
                                <p className="font-semibold text-sm mb-2">Ordered Items</p>
                                {order.order_items?.length ? (
                                  <div className="space-y-2">
                                    {order.order_items.map((item) => (
                                      <div key={item.id} className="rounded-lg border bg-background p-3 flex items-center gap-3">
                                        <img
                                          src={item.products?.image_url || "/placeholder.svg"}
                                          alt={item.products?.name || "Product"}
                                          className="w-12 h-12 rounded-md object-cover border"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{item.products?.name || "Unknown product"}</p>
                                          <p className="text-xs text-muted-foreground truncate">{item.products?.slug || "N/A"}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                          <p>Qty: <span className="font-medium">{item.quantity}</span></p>
                                          <p className="text-muted-foreground">₹{Number(item.price_at_purchase).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No order items found for this order.</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
