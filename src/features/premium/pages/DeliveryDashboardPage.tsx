import { useEffect, useState } from "react";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { premiumApi } from "@/features/premium/api/client";

interface AssignmentRow {
  id: string;
  order_id: string;
  delivery_status: string;
}

const DeliveryDashboardPage = () => {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  const load = async () => {
    const { data } = await supabase.from("premium_delivery_assignments").select("id, order_id, delivery_status").order("created_at", { ascending: false });
    setAssignments((data || []) as AssignmentRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Delivery Partner Dashboard</h1>
      <div className="space-y-2">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">Order: {assignment.order_id}</p>
              <p className="text-sm text-muted-foreground">Status: {assignment.delivery_status}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => premiumApi.updateDeliveryStatus({ assignment_id: assignment.id, status: "picked_up" }).then(load)}>Picked</Button>
              <Button size="sm" onClick={() => premiumApi.updateDeliveryStatus({ assignment_id: assignment.id, status: "delivered" }).then(load)}>Delivered</Button>
            </div>
          </div>
        ))}
      </div>
    </PremiumShell>
  );
};

export default DeliveryDashboardPage;
