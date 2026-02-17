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

    if (body.action === 'assign-order') {
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) throw new Error('Admin required');

      const { order_id, partner_id } = body.payload;
      const { error } = await admin.from('premium_delivery_assignments').insert({ order_id, partner_id, delivery_status: 'assigned' });
      if (error) throw error;
      await admin.from('premium_orders').update({ status: 'assigned_to_delivery' }).eq('id', order_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'update-status') {
      const { assignment_id, status } = body.payload;
      const { data: partner } = await admin.from('premium_delivery_partners').select('id').eq('user_id', user.id).maybeSingle();
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!partner && !isAdmin) throw new Error('Partner or admin required');

      const { data: assignment, error } = await admin.from('premium_delivery_assignments').update({ delivery_status: status }).eq('id', assignment_id).select().single();
      if (error) throw error;
      if (status === 'delivered') {
        await admin.from('premium_orders').update({ status: 'delivered' }).eq('id', assignment.order_id);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unsupported action');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
