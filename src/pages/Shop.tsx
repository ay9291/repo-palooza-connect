import { useCallback, useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 100000],
  materials: [],
  colors: [],
  inStockOnly: false,
};

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true);

      if (error) throw error;
      setProducts(data || []);
    } catch {
      setLoadError(true);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to login first to add item to cart",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const { data: existing, error: existingError } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        });

        if (error) throw error;
      }

      toast({
        title: "Added to Cart",
        description: "Product added to your cart successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query);
        const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
        const matchesStock = !filters.inStockOnly || p.stock_quantity > 0;
        return Boolean(matchesSearch && matchesPrice && matchesStock);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [filters.inStockOnly, filters.priceRange, products, searchQuery, sortBy]);

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveFilters =
    filters.inStockOnly ||
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1];

  const resetDiscoverability = () => {
    setSearchQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortBy("name");
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Engineering Wood Furniture Catalog</h1>
          <p className="text-muted-foreground">Browse our complete range of particle board furniture for wholesale</p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredAndSortedProducts.length}</span> of {products.length} products
          </p>
          {(hasActiveSearch || hasActiveFilters || sortBy !== "name") && (
            <Button variant="ghost" size="sm" onClick={resetDiscoverability}>
              Clear search & filters
            </Button>
          )}
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            {loadError ? (
              <div className="space-y-4">
                <p className="text-xl text-muted-foreground">We couldn&apos;t load the catalog right now.</p>
                <Button variant="outline" onClick={fetchProducts}>Retry</Button>
              </div>
            ) : (hasActiveSearch || hasActiveFilters) ? (
              <div className="space-y-4">
                <p className="text-xl text-muted-foreground">No products match your current search and filters.</p>
                <Button variant="outline" onClick={resetDiscoverability}>Reset filters</Button>
              </div>
            ) : (
              <p className="text-xl text-muted-foreground">No products available at the moment. Please check back later.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.name}
                modelNumber={product.slug}
                price={product.price}
                image={product.image_url || "/placeholder.svg"}
                category="Furniture"
                onAddToCart={() => handleAddToCart(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
