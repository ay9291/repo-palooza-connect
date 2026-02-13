import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManagement from "@/components/ProductManagement";
import CategoryManagement from "@/components/CategoryManagement";

const Products = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-accent/5 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Products & Categories</h1>
        <p className="text-muted-foreground">Manage your catalog with a cleaner premium workspace.</p>
      </div>

      <Tabs defaultValue="products" className="space-y-5">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Create, update and maintain inventory-ready products.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Keep categories organized for a better customer browsing experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;
