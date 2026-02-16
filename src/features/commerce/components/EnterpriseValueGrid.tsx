import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VALUES = [
  { title: "Multi-warehouse Inventory", text: "Unified stock visibility with low-stock alerts and regional allocation." },
  { title: "Role-based Security", text: "Fine-grained access for admins, customers, delivery partners, and support teams." },
  { title: "Revenue Intelligence", text: "Conversion, retention, and top-line reports for data-driven planning." },
  { title: "Order Lifecycle Automation", text: "State transitions, notifications, and delivery orchestration at scale." },
];

const EnterpriseValueGrid = () => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {VALUES.map((value) => (
        <Card key={value.title} className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{value.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{value.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnterpriseValueGrid;
