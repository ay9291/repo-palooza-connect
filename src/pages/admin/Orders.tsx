import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, UserRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileJoin = { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;

type OrderRow = {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string | null;
  total_amount: number | null;
  shipping_address: string | null;
  user_id: string;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  profiles: ProfileJoin;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  product_id: string;
};

type ProductRow = {
  id: string;
  name: string | null;
  slug: string | null;
  image_url: string | null;
};

type OrderItem = {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  product: ProductRow | null;
};

type OrderView = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
};

const statusClasses: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  processing: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  shipped: "bg-violet-500/15 text-violet-700 border-violet-500/30",
  delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

const normalizeProfile = (profile: ProfileJoin) => {
  if (!profile) return { full_name: null, email: null };
  if (Array.isArray(profile)) return profile[0] || { full_name: null, email: null };
  return profile;
};

const Orders = () => {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, total_amount, shipping_address, user_id, cancelled_by, cancellation_reason, profiles(full_name, email)")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const baseOrders = (orderData as OrderRow[]) || [];
      const orderIds = baseOrders.map((o) => o.id);

      let itemsByOrderId: Record<string, OrderItem[]> = {};

      if (orderIds.length > 0) {
        const { data: itemData, error: itemError } = await supabase
          .from("order_items")
          .select("id, order_id, quantity, price_at_purchase, product_id")
          .in("order_id", orderIds);

        if (itemError) throw itemError;

        const itemRows = (itemData as OrderItemRow[]) || [];
        const productIds = [...new Set(itemRows.map((i) => i.product_id).filter(Boolean))];

        let productsById: Record<string, ProductRow> = {};

        if (productIds.length > 0) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("id, name, slug, image_url")
            .in("id", productIds);

          if (productError) throw productError;

          productsById = ((productData as ProductRow[]) || []).reduce<Record<string, ProductRow>>((acc, product) => {
            acc[product.id] = product;
            return acc;
          }, {});
        }

        itemsByOrderId = itemRows.reduce<Record<string, OrderItem[]>>((acc, item) => {
          const mapped: OrderItem = {
            id: item.id,
            order_id: item.order_id,
            quantity: Number(item.quantity) || 0,
            price_at_purchase: Number(item.price_at_purchase) || 0,
            product: productsById[item.product_id] || null,
          };

          if (!acc[item.order_id]) acc[item.order_id] = [];
          acc[item.order_id].push(mapped);
          return acc;
        }, {});
      }

      const mappedOrders: OrderView[] = baseOrders.map((order) => {
        const profile = normalizeProfile(order.profiles);

        return {
          id: order.id,
          order_number: order.order_number || "N/A",
          created_at: order.created_at,
          status: order.status || "pending",
          total_amount: Number(order.total_amount) || 0,
          shipping_address: order.shipping_address || "Address not available",
          cancelled_by: order.cancelled_by || null,
          cancellation_reason: order.cancellation_reason || null,
          customer_name: profile.full_name || "N/A",
          customer_email: profile.email || "N/A",
          items: itemsByOrderId[order.id] || [],
        };
      });

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Failed loading admin orders", error);
      toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);

    try {
      const payload: Record<string, string | null> = { status };
      if (status === "cancelled") {
        payload.cancelled_by = "admin";
        payload.cancellation_reason = null;
      }

      const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
      if (error) throw error;

      toast({ title: "Order updated", description: "Order status saved successfully." });
      await loadOrders();
    } catch (error) {
      console.error("Failed updating order status", error);
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              placeholder="Search by order #, customer name, or email..."
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const expanded = expandedOrderId === order.id;

                    return (
                      <Fragment key={order.id}>
                        <TableRow className="hover:bg-muted/20">
                          <TableCell className="font-mono font-semibold">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                                aria-label={expanded ? "Collapse order details" : "Expand order details"}
                              >
                                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              #{order.order_number}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{order.total_amount > 0 ? `₹${order.total_amount.toLocaleString()}` : "Bulk Order"}</TableCell>
                          <TableCell>{order.items.length}</TableCell>

                          <TableCell>
                            <Badge variant="outline" className={statusClasses[order.status] || "bg-muted text-foreground border-border"}>
                              {order.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <select
                              className="text-sm border rounded px-2 py-1 bg-background"
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </TableCell>
                        </TableRow>

                        {expanded && (
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
                                  {order.items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No order items found for this order.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {order.items.map((item) => (
                                        <div key={item.id} className="rounded-lg border bg-background p-3 flex items-center gap-3">
                                          <img
                                            src={item.product?.image_url || "/placeholder.svg"}
                                            alt={item.product?.name || "Product"}
                                            className="w-12 h-12 rounded-md object-cover border"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.product?.name || "Unknown product"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.product?.slug || "N/A"}</p>
                                          </div>
                                          <div className="text-right text-sm">
                                            <p>
                                              Qty: <span className="font-medium">{item.quantity}</span>
                                            </p>
                                            <p className="text-muted-foreground">₹{item.price_at_purchase.toLocaleString()}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
