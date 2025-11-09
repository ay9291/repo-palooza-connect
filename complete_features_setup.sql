-- Complete Features Setup SQL
-- Run this in your Supabase SQL Editor after the main setup

-- ============================================
-- WISHLIST / FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- STOCK NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.stock_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
  ON public.stock_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update notifications"
  ON public.stock_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TESTIMONIALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_role TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
  ON public.testimonials FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FAQS
-- ============================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs"
  ON public.faqs FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BLOG POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SHIPPING ZONES
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  per_kg_rate DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage shipping zones"
  ON public.shipping_zones FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- GIFT CARDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  message TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gift cards"
  ON public.gift_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = purchaser_id OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can check gift card validity"
  ON public.gift_cards FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage gift cards"
  ON public.gift_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- GIFT CARD TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view gift card transactions"
  ON public.gift_card_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- LIVE CHAT CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('open', 'assigned', 'closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage conversations"
  ON public.chat_conversations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- LIVE CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can manage messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BUSINESS CUSTOMERS (B2B)
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  business_type TEXT,
  billing_address JSONB,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  credit_limit DECIMAL(10,2),
  payment_terms INTEGER DEFAULT 30,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business profile"
  ON public.business_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create business profile"
  ON public.business_customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage business customers"
  ON public.business_customers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PRODUCT ENHANCEMENTS
-- ============================================
-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS model_3d_url TEXT,
ADD COLUMN IF NOT EXISTS ar_enabled BOOLEAN DEFAULT FALSE;

-- ============================================
-- PRODUCT VIEWS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_user_id ON public.product_views(user_id);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create product views"
  ON public.product_views FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view analytics"
  ON public.product_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_customers_updated_at
  BEFORE UPDATE ON public.business_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON public.wishlists(product_id);
CREATE INDEX idx_stock_notifications_product_id ON public.stock_notifications(product_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at);
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Testimonials
INSERT INTO public.testimonials (customer_name, customer_role, content, rating, is_featured) VALUES
('Sarah Johnson', 'Interior Designer', 'Absolutely love the quality of furniture! The engineered wood pieces are stunning and durable.', 5, true),
('Michael Chen', 'Homeowner', 'Great customer service and fast delivery. The office desk exceeded my expectations.', 5, true),
('Emma Williams', 'Business Owner', 'Perfect for our office renovation. Professional quality at reasonable prices.', 4, false);

-- Sample FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('What materials do you use?', 'We use premium solid wood and high-quality engineered wood for durability and sustainability.', 'Products', 1),
('Do you offer custom sizing?', 'Yes, we offer custom sizing on most products. Contact us for a quote.', 'Products', 2),
('What is your return policy?', 'We offer 30-day returns on all products. Items must be unused and in original packaging.', 'Orders', 3),
('How long does delivery take?', 'Standard delivery takes 7-14 business days. Express shipping is available.', 'Shipping', 4),
('Do you ship internationally?', 'Yes, we ship to most countries. Shipping costs vary by location.', 'Shipping', 5);

-- Sample Shipping Zones
INSERT INTO public.shipping_zones (name, countries, base_rate, per_kg_rate, free_shipping_threshold, estimated_days_min, estimated_days_max) VALUES
('Domestic', ARRAY['US'], 15.00, 2.50, 500.00, 5, 7),
('Canada', ARRAY['CA'], 25.00, 3.50, 750.00, 7, 14),
('Europe', ARRAY['GB', 'FR', 'DE', 'IT', 'ES'], 35.00, 5.00, 1000.00, 10, 21),
('Asia Pacific', ARRAY['AU', 'JP', 'SG', 'HK'], 45.00, 6.00, 1500.00, 14, 28);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
