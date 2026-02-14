import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User, Package, Settings, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import PageHero from "@/components/layout/PageHero";

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: string;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fullName, setFullName] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error && error.code !== "PGRST116") return;

    if (data) {
      setProfile({ id: data.id, full_name: data.full_name, email: data.email, avatar_url: data.avatar_url || null });
      setFullName(data.full_name || "");
    }
  }, []);

  const fetchOrders = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (!error) setOrders((data as Order[]) || []);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      await Promise.all([fetchProfile(user.id), fetchOrders(user.id)]);
      setLoading(false);
    };

    checkUser();
  }, [fetchOrders, fetchProfile, navigate]);

  const orderStats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled").length;
    const spend = orders.reduce((acc, o) => acc + Number(o.total_amount), 0);
    return { count: orders.length, active, spend };
  }, [orders]);

  const handleUpdateProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, email: user.email, updated_at: new Date().toISOString() });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Profile updated", description: "Your profile information has been saved." });
    fetchProfile(user.id);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId || !cancellationReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a cancellation reason.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_by: "customer", cancellation_reason: cancellationReason })
      .eq("id", cancelOrderId);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
      return;
    }

    toast({ title: "Order cancelled", description: "Your order has been cancelled." });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) fetchOrders(user.id);

    setCancelOrderId(null);
    setCancellationReason("");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const avatarUrlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrlWithCacheBuster, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) toast({ title: "Error", description: updateError.message, variant: "destructive" });
    else {
      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrlWithCacheBuster } : null));
      toast({ title: "Avatar updated", description: "New avatar uploaded successfully." });
    }

    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getInitials = (name: string | null) => (name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <PageHero title="My Dashboard" description="Manage profile, review orders, and control account preferences from one place." />

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Orders" value={orderStats.count.toString()} />
          <StatCard label="Active Orders" value={orderStats.active.toString()} />
          <StatCard label="Lifetime Spend" value={`₹${orderStats.spend.toLocaleString()}`} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="overview"><User className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" />My Orders</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>View and manage your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="text-2xl">{getInitials(profile?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <Button variant="outline" disabled={uploading} asChild>
                        <span>{uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Avatar</>}</span>
                      </Button>
                    </Label>
                    <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile?.full_name || ""} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Review and manage your orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Order #{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{order.total_amount > 0 ? `₹${order.total_amount.toLocaleString()}` : "Bulk Order"}</p>
                            <p className={`text-sm capitalize font-medium ${order.status === "cancelled" ? "text-red-600" : ""}`}>{order.status}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">{order.shipping_address}</p>

                        {order.status === "cancelled" && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <p className="text-sm font-semibold text-red-600">Cancelled by: {order.cancelled_by === "admin" ? "Admin" : "You"}</p>
                            {order.cancelled_by === "customer" && order.cancellation_reason && (
                              <p className="text-sm text-red-700 mt-1">Reason: {order.cancellation_reason}</p>
                            )}
                          </div>
                        )}

                        {(order.status === "pending" || order.status === "processing") && (
                          <Button variant="destructive" size="sm" onClick={() => setCancelOrderId(order.id)}>
                            <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
              <AlertDialogDescription>Please provide a reason for cancelling this order. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea id="reason" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} className="mt-2" rows={4} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setCancelOrderId(null); setCancellationReason(""); }}>Keep Order</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">Cancel Order</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </CardContent>
  </Card>
);

export default Profile;
