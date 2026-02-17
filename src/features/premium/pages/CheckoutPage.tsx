import { useState } from "react";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";
import { premiumApi } from "@/features/premium/api/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const [shippingAddress, setShippingAddress] = useState("");
  const { cart, cartTotal, refreshCart } = useEcommerce();
  const { toast } = useToast();
  const navigate = useNavigate();

  const placeOrder = async () => {
    if (!shippingAddress.trim()) return;
    const payload = {
      shipping_address: shippingAddress,
      items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.product.price })),
      total_amount: cartTotal,
    };

    const result = await premiumApi.createOrder(payload);
    toast({ title: "Order created", description: `Order #${result.order_number}` });
    await refreshCart();
    navigate("/premium/dashboard");
  };

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="max-w-lg space-y-3">
        <Input placeholder="Shipping address" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
        <p className="text-sm">Payable: ₹{cartTotal.toLocaleString()}</p>
        <Button onClick={placeOrder} disabled={cart.length === 0}>Create Order</Button>
      </div>
    </PremiumShell>
  );
};

export default CheckoutPage;
