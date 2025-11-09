import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setFaqs((data as any) || []);
      
      // Extract unique categories
      const uniqueCategories: string[] = [];
      (data as any)?.forEach((faq: FAQ) => {
        if (!uniqueCategories.includes(faq.category)) {
          uniqueCategories.push(faq.category);
        }
      });
      setCategories(['All', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFAQsByCategory = (category: string) => {
    if (category === 'All') return faqs;
    return faqs.filter(faq => faq.category === category);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about our furniture
            </p>
          </div>

          <Tabs defaultValue="All" className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {getFAQsByCategory(category).map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border rounded-lg px-6 bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-semibold">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>

          {faqs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No FAQs available at the moment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
