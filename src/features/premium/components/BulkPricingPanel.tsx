import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkPricingPanelProps {
  discountPercent: string;
  setDiscountPercent: (value: string) => void;
  onApplyDiscount: () => Promise<void>;
  onRestockAllLowStock: () => Promise<void>;
}

const BulkPricingPanel = ({ discountPercent, setDiscountPercent, onApplyDiscount, onRestockAllLowStock }: BulkPricingPanelProps) => {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">Bulk Actions</h3>
      <div className="flex gap-2 max-w-md">
        <Input
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          placeholder="Discount % for all active products"
        />
        <Button variant="outline" onClick={onApplyDiscount}>Apply</Button>
      </div>
      <Button variant="outline" onClick={onRestockAllLowStock}>Restock all low-stock products (+20)</Button>
    </div>
  );
};

export default BulkPricingPanel;
