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
      return new Response(JSON.stringify({ error: 'Virtuagym not configured', events: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.virtuagym.com/api/v1/club/${CLUB_ID}/events?api_key=${API_KEY}&club_secret=${CLUB_SECRET}&activity_type=inclusion&limit=10&from=${today}`;

    const res = await fetch(url);
    const data = await res.json();

    return new Response(JSON.stringify({ events: data.result || data.events || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Virtuagym events error:', err);
    return new Response(JSON.stringify({ events: [], error: 'Erreur Virtuagym' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
