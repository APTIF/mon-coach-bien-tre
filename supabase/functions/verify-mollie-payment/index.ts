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
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY');
    if (!MOLLIE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mollie API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending subscription
    const { data: sub } = await supabase.from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('statut', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!sub?.mollie_payment_id) {
      return new Response(JSON.stringify({ status: 'no_pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Mollie payment status
    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${sub.mollie_payment_id}`, {
      headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` },
    });
    const payment = await mollieRes.json();

    if (payment.status === 'paid') {
      await supabase.from('subscriptions')
        .update({ statut: 'actif' })
        .eq('id', sub.id);

      await supabase.from('beneficiaries')
        .update({ subscription_active: true, statut: 'actif' })
        .eq('user_id', user_id);

      return new Response(JSON.stringify({ status: 'paid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: payment.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
