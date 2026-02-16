import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
}

interface ComparisonDrawerProps {
  items: ComparisonProduct[];
}

const ComparisonDrawer = ({ items }: ComparisonDrawerProps) => {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Add products to compare performance and pricing.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.id} className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Price: ₹{item.price.toLocaleString()}</p>
            <p>Rating: {item.rating.toFixed(1)} / 5</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComparisonDrawer;
