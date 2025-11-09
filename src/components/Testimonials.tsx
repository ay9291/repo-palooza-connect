import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  id: string;
  customer_name: string;
  customer_role: string | null;
  content: string;
  rating: number | null;
  image_url: string | null;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials' as any)
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(6);

    if (data) setTestimonials(data as any);
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real feedback from our satisfied customers
          </p>
        </div>

        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full bg-gradient-card">
                  <CardContent className="p-6 flex flex-col h-full">
                    <Quote className="w-10 h-10 text-accent mb-4" />
                    
                    {testimonial.rating && (
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating!
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-muted-foreground mb-6 flex-1">
                      {testimonial.content}
                    </p>

                    <div className="flex items-center gap-3">
                      {testimonial.image_url && (
                        <img
                          src={testimonial.image_url}
                          alt={testimonial.customer_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {testimonial.customer_name}
                        </p>
                        {testimonial.customer_role && (
                          <p className="text-sm text-muted-foreground">
                            {testimonial.customer_role}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
