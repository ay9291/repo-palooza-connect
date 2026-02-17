import { useEffect, useState } from "react";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { premiumApi } from "@/features/premium/api/client";
import { PremiumOrder } from "@/features/premium/types";

const UserDashboardPage = () => {
  const [orders, setOrders] = useState<PremiumOrder[]>([]);

  useEffect(() => {
    premiumApi.listMyOrders().then((res) => setOrders(res.orders || []));
  }, []);

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">User Dashboard</h1>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="border rounded p-3 flex justify-between">
            <span>{order.order_number}</span>
            <span>{order.status}</span>
            <span>₹{order.total_amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </PremiumShell>
  );
};

export default UserDashboardPage;
