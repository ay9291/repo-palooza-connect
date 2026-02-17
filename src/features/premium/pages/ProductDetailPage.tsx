import { useParams } from "react-router-dom";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { Button } from "@/components/ui/button";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { products, addToCart } = useEcommerce();
  const product = products.find((p) => p.id === id);

  if (!product) return <PremiumShell><p>Product not found.</p></PremiumShell>;

  return (
    <PremiumShell>
      <div className="grid lg:grid-cols-2 gap-6">
        <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full rounded-xl border" />
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
          <p className="text-xl font-semibold">₹{product.price.toLocaleString()}</p>
          <p className="text-sm">Stock: {product.stock_quantity}</p>
          <Button onClick={() => addToCart(product)}>Add to Cart</Button>
        </div>
      </div>
    </PremiumShell>
  );
};

export default ProductDetailPage;
