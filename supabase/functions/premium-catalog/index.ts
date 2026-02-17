import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const admin = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: { user } } = await admin.auth.getUser(token);
    const body = await req.json();

    if (body.action === 'list') {
      const { data, error } = await admin.from('premium_products').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ products: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!user) throw new Error('Unauthorized');

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) throw new Error('Admin required');

    if (body.action === 'upsert') {
      const payload = body.payload;
      const { data, error } = await admin.from('premium_products').upsert(payload).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'delete') {
      const { error } = await admin.from('premium_products').delete().eq('id', body.payload.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unsupported action');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
