import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { PremiumProduct } from "@/features/premium/types";

const PremiumProductCard = ({ product, onAdd }: { product: PremiumProduct; onAdd: () => void }) => (
  <Card>
    <CardContent className="p-4 space-y-3">
      <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-44 object-cover rounded" />
      <div>
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-muted-foreground">{product.category || "General"}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-bold">₹{product.price.toLocaleString()}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to={`/premium/product/${product.id}`}>View</Link></Button>
          <Button size="sm" onClick={onAdd}>Add</Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default PremiumProductCard;
