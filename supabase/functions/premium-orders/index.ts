import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const admin = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    const body = await req.json();

    if (body.action === 'list-my-orders') {
      const { data, error } = await admin.from('premium_orders').select('id, order_number, status, total_amount, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ orders: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'create-order') {
      const payload = body.payload;
      const { data: order, error: orderError } = await admin.from('premium_orders').insert({
        user_id: user.id,
        shipping_address: payload.shipping_address,
        total_amount: payload.total_amount,
        status: 'placed',
      }).select().single();
      if (orderError) throw orderError;

      const items = payload.items.map((item: { product_id: string; quantity: number; unit_price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));
      const { error: itemError } = await admin.from('premium_order_items').insert(items);
      if (itemError) throw itemError;

      const productIds = payload.items.map((i: { product_id: string }) => i.product_id);
      const { data: products } = await admin.from('premium_products').select('id, stock_quantity').in('id', productIds);
      for (const item of payload.items) {
        const product = (products || []).find((p) => p.id === item.product_id);
        if (product) {
          await admin.from('premium_products').update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) }).eq('id', item.product_id);
        }
      }

      await admin.from('premium_cart_items').delete().eq('user_id', user.id);

      return new Response(JSON.stringify({ id: order.id, order_number: order.order_number }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unsupported action');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
