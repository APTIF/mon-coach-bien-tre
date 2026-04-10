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

    const plans: Record<string, { value: string; description: string; isSepaRecurring?: boolean }> = {
      mensuel: { value: '15.00', description: 'APTIF — Démarrage' },
      accompagnement_mensuel: { value: '25.00', description: 'APTIF — Accompagnement mensuel', isSepaRecurring: true },
      accompagnement_total: { value: '140.00', description: 'APTIF — Accompagnement complet (6 mois)' },
    };

    const selected = plans[plan];
    if (!selected) {
      return new Response(JSON.stringify({ error: 'Plan invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const mollieHeaders = {
      'Authorization': `Bearer ${MOLLIE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // --- SEPA recurring flow (accompagnement_mensuel) ---
    if (selected.isSepaRecurring) {
      // 1. Check if user already has a Mollie customer
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('mollie_customer_id')
        .eq('user_id', user_id)
        .not('mollie_customer_id', 'is', null)
        .limit(1)
        .maybeSingle();

      let customerId = existingSub?.mollie_customer_id;

      // 2. Create Mollie customer if needed
      if (!customerId) {
        const customerRes = await fetch('https://api.mollie.com/v2/customers', {
          method: 'POST',
          headers: mollieHeaders,
          body: JSON.stringify({
            name: `User ${user_id}`,
            metadata: { user_id },
          }),
        });
        const customerData = await customerRes.json();
        if (!customerRes.ok) {
          console.error('Mollie customer error:', customerData);
          return new Response(JSON.stringify({ error: customerData.detail || 'Erreur création client Mollie' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        customerId = customerData.id;
      }

      // 3. Create first payment (sequenceType: first) to get SEPA mandate
      const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;
      const firstPaymentBody = {
        amount: { currency: 'EUR', value: selected.value },
        description: `${selected.description} — 1er prélèvement`,
        redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
        cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
        webhookUrl,
        method: 'directdebit',
        customerId,
        sequenceType: 'first',
        metadata: { user_id, plan, mollie_customer_id: customerId },
      };

      const paymentRes = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: mollieHeaders,
        body: JSON.stringify(firstPaymentBody),
      });
      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        console.error('Mollie first payment error:', paymentData);
        return new Response(JSON.stringify({ error: paymentData.detail || 'Erreur paiement SEPA' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 4. Store subscription record
      await supabase.from('subscriptions').insert({
        user_id,
        plan,
        status: 'pending',
        mollie_payment_id: paymentData.id,
        mollie_customer_id: customerId,
      });

      const checkoutUrl = paymentData._links?.checkout?.href;
      return new Response(JSON.stringify({ checkoutUrl, paymentId: paymentData.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Standard one-off payment flow ---
    const mollieBody = {
      amount: { currency: 'EUR', value: selected.value },
      description: selected.description,
      redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
      cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
      metadata: { user_id, plan },
    };

    const mollieRes = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: mollieHeaders,
      body: JSON.stringify(mollieBody),
    });
    const mollieData = await mollieRes.json();

    if (!mollieRes.ok) {
      console.error('Mollie error:', mollieData);
      return new Response(JSON.stringify({ error: mollieData.detail || 'Erreur Mollie' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
