import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2 } from "lucide-react";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers' as any)
        .insert({ email });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "You've been subscribed to our newsletter",
        });
        setEmail("");
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-accent py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="w-12 h-12 text-accent-foreground mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-accent-foreground">
            Subscribe to Our Newsletter
          </h3>
          <p className="text-accent-foreground/80 mb-6">
            Get the latest updates on new products, special offers, and furniture care tips
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background/10 border-accent-foreground/20 text-accent-foreground placeholder:text-accent-foreground/60"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSignup;
