import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumCartItem, PremiumProduct } from "@/features/premium/types";

interface EcommerceContextValue {
  products: PremiumProduct[];
  cart: PremiumCartItem[];
  refreshProducts: () => Promise<void>;
  refreshCart: () => Promise<void>;
  addToCart: (product: PremiumProduct) => Promise<void>;
  updateCartQty: (id: string, quantity: number) => Promise<void>;
  cartTotal: number;
}

const EcommerceContext = createContext<EcommerceContextValue | null>(null);

export const EcommerceProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<PremiumProduct[]>([]);
  const [cart, setCart] = useState<PremiumCartItem[]>([]);

  const refreshProducts = async () => {
    const { data, error } = await supabase
      .from("premium_products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (!error) setProducts((data || []) as PremiumProduct[]);
  };

  const refreshCart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCart([]);
      return;
    }
    const { data, error } = await supabase
      .from("premium_cart_items")
      .select("id, product_id, quantity, product:premium_products(*)")
      .eq("user_id", user.id);
    if (!error) {
      const normalized = ((data || []) as Array<{ id: string; product_id: string; quantity: number; product: PremiumProduct }>).map((row) => ({
        id: row.id,
        product_id: row.product_id,
        quantity: row.quantity,
        product: row.product,
      }));
      setCart(normalized);
    }
  };

  const addToCart = async (product: PremiumProduct) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      await updateCartQty(existing.id, existing.quantity + 1);
      return;
    }

    await supabase.from("premium_cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
    await refreshCart();
  };

  const updateCartQty = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await supabase.from("premium_cart_items").delete().eq("id", id);
    } else {
      await supabase.from("premium_cart_items").update({ quantity }).eq("id", id);
    }
    await refreshCart();
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  useEffect(() => {
    refreshProducts();
    refreshCart();
  }, []);

  return (
    <EcommerceContext.Provider value={{ products, cart, refreshProducts, refreshCart, addToCart, updateCartQty, cartTotal }}>
      {children}
    </EcommerceContext.Provider>
  );
};

export const useEcommerce = () => {
  const ctx = useContext(EcommerceContext);
  if (!ctx) throw new Error("useEcommerce must be used within EcommerceProvider");
  return ctx;
};
