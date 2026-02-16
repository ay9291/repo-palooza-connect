import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, UserRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type RawProfile =
  | {
      full_name: string | null;
      email: string | null;
    }
  | {
      full_name: string | null;
      email: string | null;
    }[]
  | null;

interface RawOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  user_id: string;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  profiles: RawProfile;
}

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
  name: string | null;
  slug: string | null;
  name: string;
  slug: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  product: ProductLite | null;
  products: ProductLite | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    name: string;
    slug: string;
    image_url: string | null;
  } | null;
}

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
  order_number: string | null;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  user_id: string;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  customer_name: string;
  customer_email: string;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  order_items: OrderItem[];
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    processing: "bg-sky-500/15 text-sky-700 border-sky-500/30",
    shipped: "bg-violet-500/15 text-violet-700 border-violet-500/30",
    delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    cancelled: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  };

  return colors[status] || "bg-muted text-foreground border-border";
};

const normalizeProfile = (profile: RawProfile) => {
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
      const { data: rawOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
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
          cancelled_by,
          cancellation_reason,
          profiles(full_name, email)
        `
        )
          profiles(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersList: RawOrder[] = (rawOrders as RawOrder[]) || [];
      const orderIds = ordersList.map((o) => o.id);

      let itemsByOrderId: Record<string, OrderItem[]> = {};
      if (orderIds.length > 0) {
        const { data: rawItems, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, quantity, price_at_purchase, product_id")
      const safeOrders = (ordersData as Omit<Order, "order_items">[]) || [];
      const orderIds = safeOrders.map((order) => order.id);

      let itemsByOrderId: Record<string, OrderItem[]> = {};
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            quantity,
            price_at_purchase,
            products(name, slug, image_url)
          `)
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        const itemRows: OrderItemRow[] = (rawItems as OrderItemRow[]) || [];
        const productIds = [...new Set(itemRows.map((i) => i.product_id).filter(Boolean))];

        let productsById: Record<string, ProductLite> = {};
        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("id, name, slug, image_url")
            .in("id", productIds);

          if (productsError) throw productsError;

          productsById = ((productsData as ProductLite[]) || []).reduce<Record<string, ProductLite>>((acc, product) => {
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
        itemsByOrderId = ((itemsData as OrderItem[]) || []).reduce<Record<string, OrderItem[]>>((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push(item);
          return acc;
        }, {});
      }

      const normalizedOrders: Order[] = ordersList.map((order) => {
        const profile = normalizeProfile(order.profiles);
        return {
          id: order.id,
          order_number: order.order_number || "N/A",
          created_at: order.created_at,
          status: order.status || "pending",
          total_amount: Number(order.total_amount) || 0,
          shipping_address: order.shipping_address || "Address not available",
          user_id: order.user_id,
          cancelled_by: order.cancelled_by || null,
          cancellation_reason: order.cancellation_reason || null,
          customer_name: profile.full_name || "N/A",
          customer_email: profile.email || "N/A",
          order_items: itemsByOrderId[order.id] || [],
        };
      });

      setOrders(normalizedOrders);
    } catch (error) {
      console.error("Failed loading admin orders", error);
      const hydratedOrders: Order[] = safeOrders.map((order) => ({
        ...order,
        order_items: itemsByOrderId[order.id] || [],
      }));

      setOrders(hydratedOrders);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load orders.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const patch: Record<string, string | null> = { status };
      if (status === "cancelled") {
        patch.cancelled_by = "admin";
        patch.cancellation_reason = null;
      }

      const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
      if (error) throw error;

      toast({ title: "Order updated", description: "Order status saved successfully." });
      await loadOrders();
    } catch (error) {
      console.error("Failed updating order status", error);
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
        description: "Failed to update order status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null);
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
                        <TableRow key={order.id} className="hover:bg-muted/20">
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
                              <UserRound className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{order.total_amount > 0 ? `₹${order.total_amount.toLocaleString()}` : "Bulk Order"}</TableCell>
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
                              disabled={updatingOrderId === order.id}
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

                        {expanded && (
                          <TableRow key={`${order.id}-details`}>
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
                                  {order.order_items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No order items found for this order.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {order.order_items.map((item) => (
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
