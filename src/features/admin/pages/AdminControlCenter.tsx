import Navigation from "@/components/Navigation";
import PageHero from "@/components/layout/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SystemHealthCard from "@/features/admin/components/SystemHealthCard";
import { calculateAov, calculateNetRevenue } from "@/features/admin/modules/analytics-metrics";

const SNAPSHOT = {
  grossRevenue: 1245000,
  refunds: 42000,
  orders: 386,
};

const AdminControlCenter = () => {
  const netRevenue = calculateNetRevenue(SNAPSHOT);
  const aov = calculateAov(SNAPSHOT);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <PageHero
          title="Admin Control Center"
          description="Operational analytics, revenue intelligence, and platform observability in one place."
        />

        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Net Revenue</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">₹{Math.round(netRevenue).toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{SNAPSHOT.orders}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Average Order Value</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">₹{Math.round(aov).toLocaleString()}</CardContent>
          </Card>
        </div>

        <SystemHealthCard apiLatencyMs={134} errorRate={0.3} uptimePercent={99.98} />
      </main>
    </div>
  );
};

export default AdminControlCenter;
