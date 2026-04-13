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

    const plans: Record<string, { value: string; description: string }> = {
      mensuel: { value: '15.00', description: 'APTIF — Démarrage' },
      accompagnement_mensuel: { value: '25.00', description: 'APTIF — Accompagnement mois 1/6' },
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
    if (plan === 'accompagnement_mensuel') {
      // Fetch beneficiary info for Mollie customer creation
      const { data: beneficiary } = await supabase
        .from('beneficiaries')
        .select('id, prenom, nom, email, mollie_customer_id')
        .eq('user_id', user_id)
        .maybeSingle();

      let customerId = beneficiary?.mollie_customer_id;

      // Step 1: Create Mollie customer if needed
      if (!customerId) {
        const customerRes = await fetch('https://api.mollie.com/v2/customers', {
          method: 'POST',
          headers: mollieHeaders,
          body: JSON.stringify({
            name: `${beneficiary?.prenom || ''} ${beneficiary?.nom || ''}`.trim() || `User ${user_id}`,
            email: beneficiary?.email || undefined,
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

        // Step 3: Store customer ID in beneficiaries
        if (beneficiary?.id) {
          await supabase
            .from('beneficiaries')
            .update({ mollie_customer_id: customerId })
            .eq('id', beneficiary.id);
        }
      }

      // Step 2: Create first payment with mandate
      const firstPaymentBody = {
        amount: { currency: 'EUR', value: selected.value },
        description: selected.description,
        redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
        cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
        customerId,
        sequenceType: 'first',
        method: 'directdebit',
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

      // Store subscription record
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

    // --- Standard one-off payment flow (mensuel & accompagnement_total) ---
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
