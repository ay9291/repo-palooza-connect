import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";

const links = [
  ["/premium/products", "Products"],
  ["/premium/cart", "Cart"],
  ["/premium/checkout", "Checkout"],
  ["/premium/dashboard", "User Dashboard"],
  ["/premium/admin", "Admin Dashboard"],
  ["/premium/delivery", "Delivery Dashboard"],
] as const;

const PremiumShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <div className="container mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="text-xs rounded-full border px-3 py-1 hover:bg-muted transition-colors">
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  </div>
);

export default PremiumShell;
