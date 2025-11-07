import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Package, ShoppingBag, TrendingUp, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-engineered-furniture.jpg";

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    if (data) {
      const formattedProducts = data.map(product => ({
        id: product.id,
        title: product.name,
        modelNumber: product.slug,
        price: product.price,
        wholesalePrice: product.price,
        image: product.image_url || heroImage,
        category: product.categories?.name || 'Furniture',
        rating: 4.5,
        isFeatured: true,
        isNew: true
      }));
      setFeaturedProducts(formattedProducts);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage}
            alt="Engineering Wood Furniture Collection" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Premium Particle Board Furniture
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Wholesale supplier of engineering wood furniture. Specializing in office tables, dressing tables, cupboards, conference tables, and custom-made furniture in particle board.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/shop">
                  Browse Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/contact">
                  <Phone className="w-4 h-4" />
                  Contact for Custom Orders
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Engineering Wood Specialist</h3>
                <p className="text-muted-foreground">All furniture crafted from premium particle board for durability and affordability</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Wholesale Pricing</h3>
                <p className="text-muted-foreground">Competitive rates for showrooms and retailers across Hyderabad</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Custom Manufacturing</h3>
                <p className="text-muted-foreground">Custom-made furniture in engineering wood - contact owner for requirements</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Engineering Wood Furniture</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Office tables, dressing tables, cupboards, and conference tables in particle board
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-accent-foreground">
            Need Custom Engineering Wood Furniture?
          </h2>
          <p className="text-xl text-accent-foreground/80 mb-8 max-w-2xl mx-auto">
            Contact us for custom-made particle board furniture. Bulk orders available for showrooms.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-accent-foreground text-accent border-0 hover:bg-accent-foreground/90">
            <Link to="/contact">Contact Owner - Md Farman</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
