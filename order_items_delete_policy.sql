-- Add DELETE policy for order_items to allow admins to delete them
-- This is required for product deletion to work properly

CREATE POLICY "Admins can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
