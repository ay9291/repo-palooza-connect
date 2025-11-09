import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  slug: string;
}

interface ProductRecommendationsProps {
  currentProductId: string;
  categoryId?: string | null;
}

const ProductRecommendations = ({ currentProductId, categoryId }: ProductRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [currentProductId, categoryId]);

  const fetchRecommendations = async () => {
    try {
      // Get products from the same category, excluding current product
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, slug')
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(4);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
        You Might Also Like
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.name}
            modelNumber={product.slug}
            price={product.price}
            image={product.image_url || '/placeholder.svg'}
            category="Furniture"
          />
        ))}
      </div>
    </section>
  );
};

export default ProductRecommendations;
