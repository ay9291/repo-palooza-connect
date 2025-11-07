-- Create showrooms table
CREATE TABLE public.showrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  gst_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on showrooms
ALTER TABLE public.showrooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for showrooms
CREATE POLICY "Showrooms can view their own details"
  ON public.showrooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all showrooms"
  ON public.showrooms FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert showrooms"
  ON public.showrooms FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update showrooms"
  ON public.showrooms FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete showrooms"
  ON public.showrooms FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add order_number to orders table
ALTER TABLE public.orders ADD COLUMN order_number TEXT UNIQUE;

-- Create function to generate 6-digit order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit number
    new_order_number := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO number_exists;
    
    -- If it doesn't exist, use it
    IF NOT number_exists THEN
      RETURN new_order_number;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Add RLS policies for showroom orders
CREATE POLICY "Showrooms can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'showroom')
  );

CREATE POLICY "Showrooms can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'showroom')
  );

-- Add trigger for showrooms updated_at
CREATE TRIGGER update_showrooms_updated_at
  BEFORE UPDATE ON public.showrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create reviews table for Phase 3
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(product_id, user_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();