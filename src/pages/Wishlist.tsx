import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  slug: string;
  stock_quantity: number;
}

const Wishlist = () => {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchWishlist(user.id);
  };

  const fetchWishlist = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wishlists' as any)
        .select(`
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            slug,
            stock_quantity
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const formattedProducts = data?.map((item: any) => item.products).filter(Boolean) || [];
      setProducts(formattedProducts as any);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Removed",
        description: "Product removed from wishlist",
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Heart className="w-8 h-8 text-accent fill-accent" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              Your wishlist is empty
            </p>
            <Button asChild>
              <a href="/shop">Browse Products</a>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  id={product.id}
                  title={product.name}
                  modelNumber={product.slug}
                  price={product.price}
                  image={product.image_url || '/placeholder.svg'}
                  category="Furniture"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
