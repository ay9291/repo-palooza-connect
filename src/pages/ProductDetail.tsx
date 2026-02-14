import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ReviewSection from "@/components/ReviewSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ArrowLeft, ZoomIn } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import SocialShare from "@/components/SocialShare";
import StockNotification from "@/components/StockNotification";
import ProductRecommendations from "@/components/ProductRecommendations";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PageHero from "@/components/layout/PageHero";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  slug: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProduct = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      setProduct(data);

      const { data: images, error: imagesError } = await supabase
        .from("product_images" as never)
        .select("id, image_url, display_order")
        .eq("product_id", id)
        .order("display_order", { ascending: true });

      if (imagesError) throw imagesError;
      setProductImages((images as unknown as ProductImage[]) || []);
    } catch {
      toast({ title: "Error", description: "Failed to load product details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) fetchProduct();
  }, [fetchProduct, id]);

  const handleAddToCart = async (redirectToCheckout = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: "Login Required", description: "Please login to add items to cart", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (!product) return;

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }

      if (redirectToCheckout) navigate("/checkout");
      else toast({ title: "Added to Cart", description: "Product added to your cart successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to add product to cart", variant: "destructive" });
    }
  };

  const galleryImages = useMemo(() => {
    if (productImages.length > 0) return productImages.map((img) => img.image_url);
    return product?.image_url ? [product.image_url] : ["/placeholder.svg"];
  }, [product?.image_url, productImages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8"><p className="text-center text-muted-foreground">Product not found</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <PageHero
          title={product.name}
          description={product.description || "High-quality engineered furniture crafted for modern spaces."}
          action={
            <Button variant="ghost" onClick={() => navigate("/shop")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
            </Button>
          }
        />

        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          <Card className="border-border/60 shadow-sm p-4">
            <Carousel className="w-full">
              <CarouselContent>
                {galleryImages.map((image, idx) => (
                  <CarouselItem key={`${image}-${idx}`}>
                    <div className="relative group">
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full rounded-xl aspect-square object-contain bg-muted/30 cursor-zoom-in"
                        onClick={() => setZoomedImage(image)}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setZoomedImage(image)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </Card>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 p-6 bg-card space-y-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Model: {product.slug}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold">₹{product.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">inclusive pricing</span>
              </div>
              <BadgeStock qty={product.stock_quantity} />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" className="gap-2" onClick={() => handleAddToCart(false)}>
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAddToCart(true)}>
                  Buy Now
                </Button>
                <WishlistButton productId={product.id} />
              </div>
            </div>

            <StockNotification productId={product.id} stockQuantity={product.stock_quantity} />
            <SocialShare productName={product.name} productUrl={window.location.href} />
          </div>
        </div>

        <ReviewSection productId={product.id} />
        <ProductRecommendations currentProductId={product.id} categoryId={null} />
      </div>

      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {zoomedImage && <img src={zoomedImage} alt={product.name} className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BadgeStock = ({ qty }: { qty: number }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
      qty > 10 ? "bg-emerald-500/15 text-emerald-700" : qty > 0 ? "bg-amber-500/15 text-amber-700" : "bg-rose-500/15 text-rose-700"
    }`}
  >
    {qty > 0 ? `${qty} in stock` : "Out of stock"}
  </span>
);

export default ProductDetail;
