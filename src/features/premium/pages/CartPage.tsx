import { Button } from "@/components/ui/button";
import PremiumShell from "@/features/premium/components/PremiumShell";
import { useEcommerce } from "@/features/premium/state/EcommerceContext";
import { Link } from "react-router-dom";

const CartPage = () => {
  const { cart, updateCartQty, cartTotal } = useEcommerce();

  return (
    <PremiumShell>
      <h1 className="text-2xl font-bold">Cart</h1>
      <div className="space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-muted-foreground">₹{item.product.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => updateCartQty(item.id, item.quantity - 1)}>-</Button>
              <span>{item.quantity}</span>
              <Button size="icon" variant="outline" onClick={() => updateCartQty(item.id, item.quantity + 1)}>+</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center border-t pt-4 mt-4">
        <span className="font-semibold">Total ₹{cartTotal.toLocaleString()}</span>
        <Button asChild><Link to="/premium/checkout">Proceed to Checkout</Link></Button>
      </div>
    </PremiumShell>
  );
};

export default CartPage;
