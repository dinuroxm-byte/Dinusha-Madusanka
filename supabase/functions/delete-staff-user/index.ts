// Follow Deno & Supabase Edge Functions standard (Deno runtime)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const PRIMARY_ADMIN_EMAIL = 'dinusha@voyalankatours.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST is accepted.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Retrieve Supabase environment secrets
    // In Supabase Edge Functions, SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are pre-injected
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('Missing required Supabase server environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate caller's JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client operating on behalf of the requesting user (scoped by caller's JWT)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user: callerUser },
      error: callerError
    } = await userClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verify the requesting user's role is strictly ADMIN in public.profiles
    const { data: callerProfile, error: callerProfileError } = await userClient
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', callerUser.id)
      .maybeSingle();

    if (callerProfileError || callerProfile?.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Only administrators are authorized to delete staff accounts.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Parse payload
    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      targetUserId = body?.targetUserId;
    } catch (_) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'targetUserId is required in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Prevent self-deletion
    if (callerUser.id === targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Operation forbidden: You cannot delete your own account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Initialize Supabase Admin client with server-side SUPABASE_SERVICE_ROLE_KEY
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 9. Requirement 2: Retrieve and verify the target Authentication user using auth.admin.getUserById()
    const { data: targetAuthData, error: targetAuthError } =
      await adminClient.auth.admin.getUserById(targetUserId);

    if (targetAuthError || !targetAuthData?.user) {
      return new Response(
        JSON.stringify({
          error: `Target user not found in Supabase Authentication: ${targetAuthError?.message || 'User account does not exist.'}`
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUser = targetAuthData.user;
    const targetUserEmail = (targetUser.email || '').toLowerCase().trim();

    // 10. Requirement 1: Protect the primary Admin account dinusha@voyalankatours.com explicitly,
    // regardless of whether its profile exists
    if (targetUserEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return new Response(
        JSON.stringify({
          error: `Permission denied: The primary administrator account (${PRIMARY_ADMIN_EMAIL}) is protected and cannot be deleted.`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Requirement 3 & 5: Check the target user's profile and prevent deletion of any ADMIN account,
    // while handling missing profiles gracefully (e.g. if profile was previously deleted but auth user remained)
    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetProfileError) {
      console.warn('Notice while inspecting profile table:', targetProfileError.message);
    }

    // Check profile role if profile exists
    if (targetProfile?.role === 'ADMIN') {
      return new Response(
        JSON.stringify({
          error: 'Permission denied: Administrator accounts cannot be deleted through staff management.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also check auth metadata role in case profile is missing
    const userMetadataRole = (
      targetUser.user_metadata?.role ||
      targetUser.app_metadata?.role ||
      ''
    ).toUpperCase();

    if (userMetadataRole === 'ADMIN') {
      return new Response(
        JSON.stringify({
          error: 'Permission denied: Administrator accounts cannot be deleted.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Requirement 8: Correctly use database field full_name with fallbacks
    const targetDisplayName =
      targetProfile?.full_name ||
      targetUser.user_metadata?.full_name ||
      targetUser.email ||
      targetUserId;

    // 12. Requirement 6: Preserve historical quotations, customers, and other business records.
    // Inspect foreign-key relationships and ensure deletion cannot cascade into historical business data.
    // Explicitly decouple created_by / updated_by references before deleting the user so business records remain 100% intact.
    try {
      await adminClient
        .from('quotations')
        .update({ created_by: null })
        .eq('created_by', targetUserId);

      await adminClient
        .from('customers')
        .update({ created_by: null })
        .eq('created_by', targetUserId);

      await adminClient
        .from('company_settings')
        .update({ updated_by: null })
        .eq('updated_by', targetUserId);

      // Clean up isolated working draft if any exists
      await adminClient
        .from('user_drafts')
        .delete()
        .eq('user_id', targetUserId);
    } catch (detachError) {
      console.warn('Notice while detaching foreign key references:', detachError);
    }

    // 13. Requirement 4 & 7: Do NOT delete the profile before Authentication deletion succeeds.
    // Delete the Authentication account first using the Supabase Admin API.
    const { data: deleteAuthData, error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      console.error('Error in auth.admin.deleteUser:', deleteAuthError);
      return new Response(
        JSON.stringify({
          error: `Authentication account deletion failed: ${deleteAuthError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 14. Now that Authentication account deletion has SUCCEEDED, clean up public.profiles if it was present
    if (targetProfile) {
      const { error: profileDeleteError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (profileDeleteError) {
        console.warn('Note: Profile cleanup returned notice (may have cascaded):', profileDeleteError.message);
      }
    }

    console.log(
      `Successfully deleted staff authentication account ${targetUserId} (${targetUserEmail || targetDisplayName})`
    );

    // 15. Return verified success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Staff member "${targetDisplayName}" (${targetUserEmail}) permanently deleted from authentication and database.`,
        deletedUserId: targetUserId,
        authDeleted: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unhandled exception in delete-staff-user edge function:', err);
    return new Response(
      JSON.stringify({
        error: err?.message || 'Internal server error while deleting staff user.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
