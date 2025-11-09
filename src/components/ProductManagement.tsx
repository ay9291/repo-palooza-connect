import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductImageUpload from "@/components/ProductImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock_quantity: "",
    image_url: "",
    category_id: "",
    is_active: true,
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one image
    if (productImages.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one product image is required",
        variant: "destructive",
      });
      return;
    }

    // Generate unique slug
    let slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
    
    // If creating a new product (not editing), ensure slug is unique by appending timestamp
    if (!editingProduct) {
      const timestamp = Date.now();
      slug = `${slug}-${timestamp}`;
    }

    const productData = {
      name: formData.name,
      slug: slug,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      image_url: productImages[0], // First image as main image
      category_id: formData.category_id || null,
      is_active: formData.is_active,
    };

    try {
      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;

        // Delete existing product images
        await supabase
          .from('product_images' as any)
          .delete()
          .eq('product_id', productId);

        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
        toast({ title: "Success", description: "Product created successfully" });
      }

      // Insert product images
      const imageRecords = productImages.map((url, index) => ({
        product_id: productId,
        image_url: url,
        display_order: index,
      }));

      const { error: imagesError } = await supabase
        .from('product_images' as any)
        .insert(imageRecords);

      if (imagesError) throw imagesError;

      setIsOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      is_active: product.is_active,
    });

    // Load existing product images
    try {
      const { data: images } = await supabase
        .from('product_images' as any)
        .select('image_url')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (images && images.length > 0) {
        setProductImages(images.map((img: any) => img.image_url));
      } else {
        setProductImages(product.image_url ? [product.image_url] : []);
      }
    } catch (error) {
      console.error('Error loading product images:', error);
      setProductImages(product.image_url ? [product.image_url] : []);
    }

    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      // First delete order_items with this product
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('product_id', id);

      if (orderItemsError) {
        console.error('Error deleting order items:', orderItemsError);
      }

      // Delete product images
      const { error: imagesError } = await supabase
        .from('product_images' as any)
        .delete()
        .eq('product_id', id);

      if (imagesError) {
        console.error('Error deleting product images:', imagesError);
      }

      // Delete cart items with this product
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('product_id', id);

      if (cartError) {
        console.error('Error deleting cart items:', cartError);
      }

      // Finally delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Product deleted successfully" });
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      stock_quantity: "",
      image_url: "",
      category_id: "",
      is_active: true,
    });
    setProductImages([]);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const LOW_STOCK_THRESHOLD = 10;
  const lowStockProducts = products.filter(p => p.stock_quantity <= LOW_STOCK_THRESHOLD && p.is_active);

  return (
    <div className="space-y-4">
      {lowStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} running low on stock:
            <ul className="list-disc list-inside mt-2">
              {lowStockProducts.slice(0, 5).map(p => (
                <li key={p.id}>
                  {p.name} - Only {p.stock_quantity} unit{p.stock_quantity !== 1 ? 's' : ''} left
                </li>
              ))}
              {lowStockProducts.length > 5 && (
                <li>... and {lowStockProducts.length - 5} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Inventory</h3>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Enter product details to add to catalog'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="auto-generated if empty"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ProductImageUpload
                onImagesChange={setProductImages}
                existingImages={productImages}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No products yet
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                      No image
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>₹{Number(product.price).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.stock_quantity}
                    {product.stock_quantity <= LOW_STOCK_THRESHOLD && product.is_active && (
                      <Badge variant="destructive" className="text-xs">Low</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductManagement;
