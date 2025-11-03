-- Add order notification system
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Create sequence for ITN numbers
CREATE SEQUENCE IF NOT EXISTS itn_number_seq START 100000 MAXVALUE 999999 CYCLE;

-- Function to generate ITN number
CREATE OR REPLACE FUNCTION public.generate_itn_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN LPAD(NEXTVAL('itn_number_seq')::TEXT, 6, '0');
END;
$$;

-- Add ITN number column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS itn_number TEXT;

-- Create trigger to auto-generate ITN on insert
CREATE OR REPLACE FUNCTION public.set_order_itn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.itn_number := public.generate_itn_number();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_itn_trigger ON public.orders;
CREATE TRIGGER set_order_itn_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_itn();

-- RLS policy for admin to view all notifications
CREATE POLICY "Admins can view all order notifications"
  ON public.order_notifications
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy for admin to update notifications
CREATE POLICY "Admins can update order notifications"
  ON public.order_notifications
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert notification on new order
CREATE OR REPLACE FUNCTION public.notify_admin_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.order_notifications (order_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_trigger ON public.orders;
CREATE TRIGGER notify_admin_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_order();