import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  LogOut,
  LayoutDashboard,
  Heart,
  Package
} from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchCartCount(user.id);
        checkAdminRole(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCartCount(session.user.id);
        checkAdminRole(session.user.id);
      } else {
        setCartCount(0);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchCartCount = async (userId: string) => {
    const { data } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId);
    
    const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    setCartCount(total);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Ms Furniture Enterprises" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-accent transition-smooth font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Login & Cart */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}

            {/* Orders Link */}
            {user && (
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Orders
                </Button>
              </Link>
            )}

            {/* Profile Link */}
            {user && (
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
            )}

            {/* Wishlist */}
            {user && (
              <Link to="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth Button */}
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Admin Dashboard Link - Mobile */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}

              {/* Orders Link - Mobile */}
              {user && (
                <Link
                  to="/orders"
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </Link>
              )}

              {/* Profile Link - Mobile */}
              {user && (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              )}

              {/* Wishlist Link - Mobile */}
              {user && (
                <Link
                  to="/wishlist"
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  Wishlist
                </Link>
              )}
              
              {/* Mobile Cart */}
              <Link
                to="/cart"
                className="block px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                onClick={() => setIsOpen(false)}
              >
                Cart ({cartCount})
              </Link>

              {/* Mobile Auth Link */}
              <div className="border-t border-border pt-2 mt-2">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-accent transition-smooth font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;