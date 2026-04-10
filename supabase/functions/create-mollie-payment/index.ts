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

    const { plan, user_id, redirect_base_url } = await req.json();

    const plans: Record<string, { value: string; description: string; method?: string[] }> = {
      mensuel: { value: '15.00', description: 'APTIF — Démarrage' },
      accompagnement_mensuel: { value: '25.00', description: 'APTIF — Accompagnement mensuel (1er mois)', method: ['directdebit'] },
      accompagnement_total: { value: '140.00', description: 'APTIF — Accompagnement complet (6 mois)' },
    };

    const selected = plans[plan];
    if (!selected) {
      return new Response(JSON.stringify({ error: 'Plan invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mollieBody: Record<string, unknown> = {
      amount: { currency: 'EUR', value: selected.value },
      description: selected.description,
      redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
      cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
      metadata: { user_id, plan },
    };

    if (selected.method) {
      mollieBody.method = selected.method;
    }
    });

    const mollieData = await mollieRes.json();

    if (!mollieRes.ok) {
      console.error('Mollie error:', mollieData);
      return new Response(JSON.stringify({ error: mollieData.detail || 'Erreur Mollie' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store payment in subscriptions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('subscriptions').insert({
      user_id,
      plan,
      status: 'pending',
      mollie_payment_id: mollieData.id,
    });

    const checkoutUrl = mollieData._links?.checkout?.href;

    return new Response(JSON.stringify({ checkoutUrl, paymentId: mollieData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
