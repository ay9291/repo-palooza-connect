import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, Store, TrendingUp, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  collectStatusBreakdown,
  computeFulfillmentMetrics,
  detectOperationalFlags,
  summarizeTopProducts,
} from "@/features/admin/modules/dashboard-insights";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalShowrooms: number;
  totalRevenue: number;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_number: string;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalShowrooms: 0,
    totalRevenue: 0,
  });
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [ordersRes, productsRes, showroomsRes, lowStockRes, orderItemsRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_amount, created_at, order_number").order("created_at", { ascending: false }).limit(30),
      supabase.from("products").select("id"),
      supabase.from("showrooms").select("id"),
      supabase.from("products").select("id").lte("stock_quantity", 5),
      supabase.from("order_items").select("quantity, price_at_purchase, product:products(name)").limit(200),
    ]);

    const safeOrders = (ordersRes.data || []) as OrderRow[];
    const pendingOrders = safeOrders.filter((o) => o.status === "pending").length;
    const totalRevenue = safeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    setStats({
      totalOrders: safeOrders.length,
      pendingOrders,
      totalProducts: productsRes.data?.length || 0,
      totalShowrooms: showroomsRes.data?.length || 0,
      totalRevenue,
    });

    setOrders(safeOrders);
    setLowStockCount(lowStockRes.data?.length || 0);

    const normalizedItems = ((orderItemsRes.data || []) as Array<{ quantity: number; price_at_purchase: number; product: { name: string } | null }>).map((row) => ({
      quantity: row.quantity,
      price_at_purchase: row.price_at_purchase,
      product_name: row.product?.name || "Unknown",
    }));
    setTopProducts(summarizeTopProducts(normalizedItems));
  };

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, icon: ShoppingBag },
    { label: "Products", value: stats.totalProducts, sub: "In catalog", icon: Package },
    { label: "Showrooms", value: stats.totalShowrooms, sub: "Active partners", icon: Store },
    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, sub: "Total earnings", icon: TrendingUp },
  ];

  const fulfillment = useMemo(() => computeFulfillmentMetrics(orders), [orders]);
  const statusBreakdown = useMemo(() => collectStatusBreakdown(orders), [orders]);
  const flags = useMemo(
    () => detectOperationalFlags({
      pendingOrders: fulfillment.pending,
      lowStockCount,
      cancellationRate: fulfillment.total ? fulfillment.cancelled / fulfillment.total : 0,
    }),
    [fulfillment, lowStockCount],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-accent/10 p-6 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Your control center for operations and performance.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button asChild variant="outline"><Link to="/admin/orders">Manage Orders</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/products">Manage Products</Link></Button>
          <Button asChild><Link to="/admin/control-center">Open Operations Console</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Fulfillment Health</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Delivered rate</span><span>{fulfillment.progress}%</span></div>
              <Progress value={fulfillment.progress} />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.map((item) => (
                <Badge key={item.status} variant="outline">{item.status}: {item.count}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Low stock items: {lowStockCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Operational Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-accent" /> Pending spike: {flags.pendingSpike ? "Yes" : "No"}</p>
            <p className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-accent" /> Low stock risk: {flags.lowStockRisk ? "Yes" : "No"}</p>
            <p className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-accent" /> Cancellation risk: {flags.cancellationRisk ? "Yes" : "No"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Top Products by Revenue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {topProducts.map((item) => (
            <div key={item.name} className="border rounded p-3 flex justify-between text-sm">
              <span>{item.name}</span>
              <span>Qty: {item.qty}</span>
              <span>₹{Math.round(item.revenue).toLocaleString()}</span>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No order item data available yet.</p>}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Insight</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-accent" /> Keep pending orders under control to improve fulfillment velocity.</p>
          <p className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-accent" /> Review product catalog weekly to ensure top-sellers stay in stock.</p>
          <p className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-accent" /> Use Operations Console for deeper analytics and system health checks.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
