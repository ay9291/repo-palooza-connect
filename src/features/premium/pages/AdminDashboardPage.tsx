import { useEffect, useMemo, useState } from "react";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { premiumApi } from "@/features/premium/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumProduct } from "@/features/premium/types";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminInsightCards from "@/features/premium/components/AdminInsightCards";
import LowStockManager from "@/features/premium/components/LowStockManager";
import PartnerPerformancePanel from "@/features/premium/components/PartnerPerformancePanel";
import { buildAdminKpis, buildPartnerAssignmentStats, filterOrdersByStatus } from "@/features/premium/modules/admin-insights";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}
interface PartnerRow {
  id: string;
  full_name: string;
}
interface AssignmentRow {
  id: string;
  partner_id: string;
  delivery_status: string;
}

const ORDER_STATUSES = ["placed", "processing", "assigned_to_delivery", "delivered", "cancelled"] as const;

const AdminDashboardPage = () => {
  const { products, refreshProducts } = useEcommerce();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOps = async () => {
    const { data: o } = await supabase
      .from("premium_orders")
      .select("id, order_number, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const { data: p } = await supabase.from("premium_delivery_partners").select("id, full_name").eq("is_active", true);
    const { data: a } = await supabase
      .from("premium_delivery_assignments")
      .select("id, partner_id, delivery_status")
      .order("created_at", { ascending: false })
      .limit(100);

    setOrders((o || []) as OrderRow[]);
    setPartners((p || []) as PartnerRow[]);
    setAssignments((a || []) as AssignmentRow[]);
  };

  useEffect(() => {
    refreshProducts();
    loadOps();
  }, []);

  const createProduct = async () => {
    await premiumApi.upsertProduct({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      price: Number(price),
      stock_quantity: 20,
      is_active: true,
    });
    setName("");
    setPrice("0");
    await refreshProducts();
  };

  const assign = async (orderId: string, partnerId: string) => {
    await premiumApi.assignOrder({ order_id: orderId, partner_id: partnerId });
    await loadOps();
  };

  const setOrderStatus = async (orderId: string, nextStatus: string) => {
    await supabase.from("premium_orders").update({ status: nextStatus }).eq("id", orderId);
    await loadOps();
  };

  const restockProduct = async (productId: string, current: number) => {
    await supabase.from("premium_products").update({ stock_quantity: current + 20 }).eq("id", productId);
    await refreshProducts();
  };

  const toggleActive = async (product: PremiumProduct) => {
    await supabase.from("premium_products").update({ is_active: !product.is_active }).eq("id", product.id);
    await refreshProducts();
  };

  const kpis = useMemo(() => buildAdminKpis({ products, orders, assignments }), [products, orders, assignments]);
  const filteredOrders = useMemo(() => filterOrdersByStatus(orders, statusFilter), [orders, statusFilter]);
  const partnerStats = useMemo(() => buildPartnerAssignmentStats(partners, assignments), [partners, assignments]);

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <AdminInsightCards
        totalProducts={kpis.totalProducts}
        openOrders={kpis.openOrders}
        lowStockCount={kpis.lowStockCount}
        totalRevenue={kpis.totalRevenue}
        activeAssignments={kpis.activeAssignments}
      />

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Create Product</h2>
          <div className="max-w-lg flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New product name" />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
            <Button onClick={createProduct}>Create</Button>
          </div>

          <h2 className="text-lg font-semibold mt-6">Product Operations</h2>
          <div className="space-y-2">
            {products.map((product: PremiumProduct) => (
              <div key={product.id} className="border p-3 rounded flex justify-between items-center gap-3">
                <div>
                  <p>{product.name}</p>
                  <p className="text-xs text-muted-foreground">Stock {product.stock_quantity} · {product.is_active ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => restockProduct(product.id, product.stock_quantity)}>+20 Stock</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(product)}>{product.is_active ? "Deactivate" : "Activate"}</Button>
                  <Button size="sm" variant="outline" onClick={() => premiumApi.removeProduct(product.id).then(refreshProducts)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          <LowStockManager products={products} onRestock={restockProduct} />

          <h2 className="text-lg font-semibold mt-6">Delivery Partner Performance</h2>
          <PartnerPerformancePanel stats={partnerStats} />
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8">Order Operations</h2>
      <div className="max-w-xs mb-3">
        <Label>Filter by Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredOrders.map((order) => (
          <div key={order.id} className="border p-3 rounded space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()} · ₹{Number(order.total_amount).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {ORDER_STATUSES.map((status) => (
                  <Button
                    key={`${order.id}-${status}`}
                    size="sm"
                    variant={order.status === status ? "default" : "outline"}
                    onClick={() => setOrderStatus(order.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {order.status === "placed" && (
              <div className="flex gap-2 flex-wrap">
                {partners.map((partner) => (
                  <Button key={partner.id} size="sm" variant="outline" onClick={() => assign(order.id, partner.id)}>
                    Assign {partner.full_name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PremiumShell>
  );
};

export default AdminDashboardPage;
