import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (!hasAdminRole) {
      throw new Error('Unauthorized: Admin access required')
    }

    const { email, password, business_name, contact_person, phone, address, city, state, gst_number, notes } = await req.json()

    // Create the showroom user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: contact_person
      }
    })

    if (createUserError) throw createUserError

    // Assign showroom role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'showroom' })

    if (roleError) throw roleError

    // Create showroom profile
    const { error: showroomError } = await supabaseAdmin
      .from('showrooms')
      .insert({
        user_id: newUser.user.id,
        business_name,
        contact_person,
        phone,
        address,
        city,
        state,
        gst_number,
        notes
      })

    if (showroomError) throw showroomError

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
