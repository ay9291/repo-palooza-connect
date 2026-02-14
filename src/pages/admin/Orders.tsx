import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { Search, ChevronDown, ChevronUp, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItemRow {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  product_id: string;
}

interface ProductLite {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  products: ProductLite | null;
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
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          status,
          total_amount,
          shipping_address,
          user_id,
          profiles(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const safeOrders = (ordersData as Omit<Order, "order_items">[]) || [];
      const orderIds = safeOrders.map((order) => order.id);

      let itemsByOrderId: Record<string, OrderItem[]> = {};

      if (orderIds.length > 0) {
        const { data: itemRows, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, quantity, price_at_purchase, product_id")
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        const orderItemRows = (itemRows as OrderItemRow[]) || [];
        const productIds = [...new Set(orderItemRows.map((item) => item.product_id))];

        let productsById: Record<string, ProductLite> = {};
        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("id, name, slug, image_url")
            .in("id", productIds);

          if (productsError) throw productsError;

          productsById = ((productsData as ProductLite[]) || []).reduce<Record<string, ProductLite>>((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }

        itemsByOrderId = orderItemRows.reduce<Record<string, OrderItem[]>>((acc, item) => {
          const mapped: OrderItem = {
            id: item.id,
            order_id: item.order_id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            products: productsById[item.product_id] || null,
          };

          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push(mapped);
          return acc;
        }, {});
      }

      const hydratedOrders: Order[] = safeOrders.map((order) => ({
        ...order,
        order_items: itemsByOrderId[order.id] || [],
      }));

      setOrders(hydratedOrders);
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
        const orderNumber = order.order_number?.toLowerCase() || "";
        const email = order.profiles?.email?.toLowerCase() || "";
        const fullName = order.profiles?.full_name?.toLowerCase() || "";

        return orderNumber.includes(query) || email.includes(query) || fullName.includes(query);
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
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <Fragment key={order.id}>
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
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
                        <TableCell>{order.order_items.length}</TableCell>
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

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 border-l-4 border-l-primary">
                            <div className="py-4 space-y-4">
                              <div>
                                <p className="font-semibold text-sm mb-1">Shipping Address</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{order.shipping_address}</p>
                              </div>

                              {order.status === "cancelled" && (
                                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                                  <p>Cancelled by: {order.cancelled_by === "admin" ? "Admin" : "Customer"}</p>
                                  {order.cancellation_reason && <p>Reason: {order.cancellation_reason}</p>}
                                </div>
                              )}

                              <div>
                                <p className="font-semibold text-sm mb-2">Ordered Items</p>
                                {order.order_items.length ? (
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
                                          <p>
                                            Qty: <span className="font-medium">{item.quantity}</span>
                                          </p>
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
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
