import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  modelNumber: string;
  price: number;
  wholesalePrice?: number;
  image: string;
  category: string;
  rating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  onAddToCart?: () => void;
}

const ProductCard = ({
  id,
  title,
  modelNumber,
  price,
  wholesalePrice,
  image,
  category,
  rating = 4.5,
  isFeatured,
  isNew,
  onAddToCart
}: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden hover:shadow-medium transition-smooth bg-gradient-card">
      <CardHeader className="p-0 relative cursor-pointer" onClick={() => navigate(`/product/${id}`)}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-smooth"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {isNew && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              New
            </Badge>
          )}
          {isFeatured && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>

        {/* Category */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            {category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 cursor-pointer" onClick={() => navigate(`/product/${id}`)}>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-accent transition-smooth">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            Model: {modelNumber}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({rating})</span>
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="text-xl font-bold text-foreground">
              ₹{price.toLocaleString()}
            </div>
            {wholesalePrice && (
              <div className="text-sm text-muted-foreground">
                Wholesale: ₹{wholesalePrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          variant="cart" 
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;