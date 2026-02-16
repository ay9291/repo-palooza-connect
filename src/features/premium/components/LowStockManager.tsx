import { Button } from "@/components/ui/button";
import { PremiumProduct } from "@/features/premium/types";

interface LowStockManagerProps {
  products: PremiumProduct[];
  onRestock: (productId: string, current: number) => Promise<void>;
}

const LowStockManager = ({ products, onRestock }: LowStockManagerProps) => {
  const lowStock = products.filter((product) => product.stock_quantity <= 5);

  if (lowStock.length === 0) {
    return <p className="text-sm text-muted-foreground">No low-stock products right now.</p>;
  }

  return (
    <div className="space-y-2">
      {lowStock.map((product) => (
        <div key={product.id} className="border rounded p-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">Current stock: {product.stock_quantity}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onRestock(product.id, product.stock_quantity)}>
            Restock +20
          </Button>
        </div>
      ))}
    </div>
  );
};

export default LowStockManager;
