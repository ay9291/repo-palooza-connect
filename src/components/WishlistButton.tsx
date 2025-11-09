import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface WishlistButtonProps {
  productId: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

const WishlistButton = ({ productId, size = "icon", variant = "ghost" }: WishlistButtonProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkWishlistStatus();
  }, [productId]);

  const checkWishlistStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('wishlists' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    setIsInWishlist(!!data);
  };

  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to wishlist",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists' as any)
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setIsInWishlist(false);
        toast({
          title: "Removed",
          description: "Removed from wishlist",
        });
      } else {
        const { error } = await supabase
          .from('wishlists' as any)
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) throw error;

        setIsInWishlist(true);
        toast({
          title: "Added",
          description: "Added to wishlist",
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleWishlist}
      disabled={loading}
      className="relative"
    >
      <Heart
        className={`w-5 h-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
};

export default WishlistButton;
