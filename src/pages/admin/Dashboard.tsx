import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, Store, TrendingUp, ArrowUpRight } from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalShowrooms: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalShowrooms: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [ordersRes, productsRes, showroomsRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_amount"),
      supabase.from("products").select("id"),
      supabase.from("showrooms").select("id"),
    ]);

    const orders = ordersRes.data || [];
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    setStats({
      totalOrders: orders.length,
      pendingOrders,
      totalProducts: productsRes.data?.length || 0,
      totalShowrooms: showroomsRes.data?.length || 0,
      totalRevenue,
    });
  };

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, icon: ShoppingBag },
    { label: "Products", value: stats.totalProducts, sub: "In catalog", icon: Package },
    { label: "Showrooms", value: stats.totalShowrooms, sub: "Active partners", icon: Store },
    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, sub: "Total earnings", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-accent/10 p-6 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Your premium control center for operations and performance.</p>
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

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Insight</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-accent" /> Keep pending orders under control to improve fulfillment velocity.</p>
          <p className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-accent" /> Review product catalog weekly to ensure top-sellers stay in stock.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
