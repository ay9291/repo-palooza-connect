import { useEffect, useState } from "react";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { premiumApi } from "@/features/premium/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumProduct } from "@/features/premium/types";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";
import { supabase } from "@/integrations/supabase/client";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
}
interface PartnerRow {
  id: string;
  full_name: string;
}

const AdminDashboardPage = () => {
  const { products, refreshProducts } = useEcommerce();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);

  const loadOps = async () => {
    const { data: o } = await supabase.from("premium_orders").select("id, order_number, status").eq("status", "placed").order("created_at", { ascending: false });
    const { data: p } = await supabase.from("premium_delivery_partners").select("id, full_name").eq("is_active", true);
    setOrders((o || []) as OrderRow[]);
    setPartners((p || []) as PartnerRow[]);
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

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="max-w-lg flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New product name" />
        <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
        <Button onClick={createProduct}>Create</Button>
      </div>
      <div className="space-y-2 mt-4">
        {products.map((product: PremiumProduct) => (
          <div key={product.id} className="border p-3 rounded flex justify-between items-center">
            <span>{product.name}</span>
            <div className="flex gap-2">
              <span>Stock {product.stock_quantity}</span>
              <Button size="sm" variant="outline" onClick={() => premiumApi.removeProduct(product.id).then(refreshProducts)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-8">Assign Orders to Delivery Partners</h2>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="border p-3 rounded flex justify-between gap-3 items-center">
            <span>{order.order_number}</span>
            <div className="flex gap-2 flex-wrap">
              {partners.map((partner) => (
                <Button key={partner.id} size="sm" variant="outline" onClick={() => assign(order.id, partner.id)}>
                  Assign {partner.full_name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PremiumShell>
  );
};

export default AdminDashboardPage;
