import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminInsightCardsProps {
  totalProducts: number;
  openOrders: number;
  lowStockCount: number;
  totalRevenue: number;
  activeAssignments: number;
}

const AdminInsightCards = ({ totalProducts, openOrders, lowStockCount, totalRevenue, activeAssignments }: AdminInsightCardsProps) => {
  const cards = [
    { label: "Total Products", value: totalProducts.toString() },
    { label: "Open Orders", value: openOrders.toString() },
    { label: "Low Stock Alerts", value: lowStockCount.toString() },
    { label: "Delivered Revenue", value: `₹${Math.round(totalRevenue).toLocaleString()}` },
    { label: "Active Assignments", value: activeAssignments.toString() },
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminInsightCards;
