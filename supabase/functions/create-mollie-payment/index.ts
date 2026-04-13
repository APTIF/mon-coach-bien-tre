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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { plan, user_id, user_email, user_name, redirect_base_url } = await req.json();

    if (plan === 'accompagnement_mensuel') {
      const customerRes = await fetch('https://api.mollie.com/v2/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user_name,
          email: user_email,
          metadata: { user_id },
        }),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        return new Response(JSON.stringify({ error: customerData.detail || 'Erreur customer Mollie' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const mollieCustomerId = customerData.id;
      await supabase.from('beneficiaries')
        .update({ mollie_customer_id: mollieCustomerId })
        .eq('user_id', user_id);

      const paymentRes = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: '25.00' },
          description: 'APTIF — Accompagnement mois 1/6',
          redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
          cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
          customerId: mollieCustomerId,
          sequenceType: 'first',
          metadata: { user_id, plan: 'accompagnement_mensuel', mois: 1 },
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        return new Response(JSON.stringify({ error: paymentData.detail || 'Erreur paiement Mollie' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('subscriptions').insert({
        user_id, plan: 'accompagnement_mensuel',
        status: 'pending', mollie_payment_id: paymentData.id,
        mollie_customer_id: mollieCustomerId,
      });

      return new Response(JSON.stringify({ 
        checkoutUrl: paymentData._links?.checkout?.href, 
        paymentId: paymentData.id 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (plan === 'mensuel') {
      const paymentRes = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: '15.00' },
          description: 'APTIF — Démarrage',
          redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
          cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
          method: ['creditcard'],
          metadata: { user_id, plan: 'mensuel' },
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        return new Response(JSON.stringify({ error: paymentData.detail || 'Erreur Mollie' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('subscriptions').insert({
        user_id, plan: 'mensuel',
        status: 'pending', mollie_payment_id: paymentData.id,
      });

      return new Response(JSON.stringify({ 
        checkoutUrl: paymentData._links?.checkout?.href,
        paymentId: paymentData.id 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (plan === 'accompagnement_total') {
      const paymentRes = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: '140.00' },
          description: 'APTIF — Accompagnement complet 6 mois',
          redirectUrl: `${redirect_base_url}/rdvinclusion?payment=success`,
          cancelUrl: `${redirect_base_url}/formules?payment=cancelled`,
          method: ['creditcard'],
          metadata: { user_id, plan: 'accompagnement_total' },
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        return new Response(JSON.stringify({ error: paymentData.detail || 'Erreur Mollie' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('subscriptions').insert({
        user_id, plan: 'accompagnement_total',
        status: 'pending', mollie_payment_id: paymentData.id,
      });

      return new Response(JSON.stringify({ 
        checkoutUrl: paymentData._links?.checkout?.href,
        paymentId: paymentData.id 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Plan invalide' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
