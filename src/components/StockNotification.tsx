import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StockNotificationProps {
  productId: string;
  productName: string;
}

const StockNotification = ({ productId, productName }: StockNotificationProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to get notified",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('stock_notifications' as any)
        .insert({
          user_id: user.id,
          product_id: productId,
          email: email || user.email,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Registered",
            description: "You're already on the notification list for this product",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "We'll notify you when this product is back in stock",
        });
        setOpen(false);
        setEmail("");
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Bell className="w-4 h-4 mr-2" />
          Notify When Available
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Notified</DialogTitle>
          <DialogDescription>
            Enter your email to be notified when "{productName}" is back in stock
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Notify Me"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockNotification;
