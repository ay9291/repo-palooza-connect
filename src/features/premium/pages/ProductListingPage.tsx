import PremiumShell from "@/features/premium/components/PremiumShell";
import PremiumProductCard from "@/features/premium/components/PremiumProductCard";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";

const ProductListingPage = () => {
  const { products, addToCart } = useEcommerce();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Premium Product Listing</h1>
      <Input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => <PremiumProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />)}
      </div>
    </PremiumShell>
  );
};

export default ProductListingPage;
