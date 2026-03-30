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
      return new Response(JSON.stringify({ error: 'Virtuagym not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event_id, member_id } = await req.json();

    if (!event_id || !member_id) {
      return new Response(JSON.stringify({ error: 'event_id et member_id requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://api.virtuagym.com/api/v1/club/${CLUB_ID}/events/${event_id}/participants?api_key=${API_KEY}&club_secret=${CLUB_SECRET}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Erreur réservation' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Book event error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
