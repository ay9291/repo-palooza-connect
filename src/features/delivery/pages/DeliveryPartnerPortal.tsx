import Navigation from "@/components/Navigation";
import PageHero from "@/components/layout/PageHero";
import AssignedOrdersList from "@/features/delivery/components/AssignedOrdersList";
import { calculateEarnings } from "@/features/delivery/modules/earnings-ledger";

interface DeliveryJob {
  id: string;
  status: "assigned" | "picked_up" | "delivered";
  payout: number;
}

const JOBS: DeliveryJob[] = [
  { id: "ORD-1132", status: "assigned", payout: 120 },
  { id: "ORD-1130", status: "picked_up", payout: 180 },
  { id: "ORD-1128", status: "delivered", payout: 210 },
  { id: "ORD-1121", status: "delivered", payout: 190 },
];

const DeliveryPartnerPortal = () => {
  const earnings = calculateEarnings(JOBS);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <PageHero
          title="Delivery Partner Portal"
          description="Manage assigned orders, update status, and track completed delivery earnings."
        />

        <div className="rounded-lg border p-4 bg-card">
          <p className="text-sm text-muted-foreground">Delivered earnings</p>
          <p className="text-2xl font-bold">₹{earnings.toLocaleString()}</p>
        </div>

        <AssignedOrdersList jobs={JOBS} />
      </main>
    </div>
  );
};

export default DeliveryPartnerPortal;
