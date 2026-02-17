import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const ShowroomDashboard = lazy(() => import("./pages/ShowroomDashboard"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Products = lazy(() => import("./pages/admin/Products"));
const Showrooms = lazy(() => import("./pages/admin/Showrooms"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveChat = lazy(() => import("./components/LiveChat"));
const EnterpriseExperience = lazy(() => import("./features/commerce/pages/EnterpriseExperience"));
const AdminControlCenter = lazy(() => import("./features/admin/pages/AdminControlCenter"));
const DeliveryPartnerPortal = lazy(() => import("./features/delivery/pages/DeliveryPartnerPortal"));
const PremiumRoot = lazy(() => import("./features/premium/pages/PremiumRoot"));
const ProductListingPage = lazy(() => import("./features/premium/pages/ProductListingPage"));
const ProductDetailPage = lazy(() => import("./features/premium/pages/ProductDetailPage"));
const CartPage = lazy(() => import("./features/premium/pages/CartPage"));
const CheckoutPage = lazy(() => import("./features/premium/pages/CheckoutPage"));
const UserDashboardPage = lazy(() => import("./features/premium/pages/UserDashboardPage"));
const AdminDashboardPage = lazy(() => import("./features/premium/pages/AdminDashboardPage"));
const DeliveryDashboardPage = lazy(() => import("./features/premium/pages/DeliveryDashboardPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="showrooms" element={<Showrooms />} />
            </Route>
            <Route path="/showroom-dashboard" element={<ShowroomDashboard />} />
            <Route path="/enterprise" element={<EnterpriseExperience />} />
            <Route path="/admin/control-center" element={<AdminControlCenter />} />
            <Route path="/delivery-portal" element={<DeliveryPartnerPortal />} />
            <Route path="/premium" element={<PremiumRoot />}>
              <Route path="products" element={<ProductListingPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="dashboard" element={<UserDashboardPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="delivery" element={<DeliveryDashboardPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <LiveChat />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
