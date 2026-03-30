import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('VIRTUAGYM_API_KEY');
    const CLUB_ID = Deno.env.get('VIRTUAGYM_CLUB_ID');
    const CLUB_SECRET = Deno.env.get('VIRTUAGYM_CLUB_SECRET');

    if (!API_KEY || !CLUB_ID || !CLUB_SECRET) {
      console.log('Virtuagym not configured, skipping member creation');
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, email, nom, prenom } = await req.json();

    const url = `https://api.virtuagym.com/api/v1/club/${CLUB_ID}/member?api_key=${API_KEY}&club_secret=${CLUB_SECRET}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        lastname: nom,
        firstname: prenom,
      }),
    });

    const data = await res.json();

    if (res.ok && data.member_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('beneficiaries')
        .update({ virtuagym_member_id: data.member_id.toString() })
        .eq('user_id', user_id);

      return new Response(JSON.stringify({ success: true, member_id: data.member_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Virtuagym member creation response:', data);
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Virtuagym member creation error:', err);
    // Never block user flow
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
