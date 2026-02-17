interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

const TopProductsPanel = ({ items }: { items: TopProduct[] }) => {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="border rounded p-3 flex items-center justify-between">
          <p className="font-medium">{item.name}</p>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Qty: {item.qty}</span>
            <span>Revenue: ₹{Math.round(item.revenue).toLocaleString()}</span>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No product sales data yet.</p>}
    </div>
  );
};

export default TopProductsPanel;
