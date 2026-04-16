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
      return new Response('Missing API key', { status: 500 });
    }

    // Mollie sends webhook as form-urlencoded with `id` field
    const formData = await req.formData();
    const paymentId = formData.get('id') as string;

    if (!paymentId) {
      return new Response('Missing payment id', { status: 400 });
    }

    console.log('Webhook received for payment:', paymentId);

    // Fetch payment details from Mollie
    const mollieHeaders = {
      'Authorization': `Bearer ${MOLLIE_API_KEY}`,
    };

    const paymentRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: mollieHeaders,
    });
    const payment = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error('Failed to fetch payment:', payment);
      return new Response('Failed to fetch payment', { status: 500 });
    }

    console.log('Payment status:', payment.status, 'sequenceType:', payment.sequenceType);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update subscription status based on payment status
    const newStatus = payment.status === 'paid' ? 'active' : payment.status;
    await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('mollie_payment_id', paymentId);

    // Log payment event
    const metadata = payment.metadata || {};
    await supabase.from('payment_logs').insert({
      user_id: metadata.user_id,
      event: `webhook_${payment.status}`,
      plan: metadata.plan,
      mollie_payment_id: paymentId,
      amount: payment.amount?.value,
      status: payment.status,
      metadata: { sequenceType: payment.sequenceType, customerId: payment.customerId },
    });

    // If this was a successful first SEPA payment, create the recurring subscription
    if (payment.status === 'paid' && payment.sequenceType === 'first') {
      const customerId = payment.customerId;
      const metadata = payment.metadata || {};
      const plan = metadata.plan;

      if (customerId && plan === 'accompagnement_mensuel') {
        console.log('Creating recurring subscription for customer:', customerId);

        // Create Mollie subscription (5 remaining payments after the first)
        const subRes = await fetch(`https://api.mollie.com/v2/customers/${customerId}/subscriptions`, {
          method: 'POST',
          headers: {
            ...mollieHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: { currency: 'EUR', value: '25.00' },
            times: 5, // 5 remaining months (first already paid)
            interval: '1 month',
            description: 'APTIF — Accompagnement mensuel',
            webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook`,
            metadata: { user_id: metadata.user_id, plan },
          }),
        });

        const subData = await subRes.json();

        if (subRes.ok) {
          console.log('Subscription created:', subData.id);
          // Update the subscription record with the Mollie subscription ID
          await supabase
            .from('subscriptions')
            .update({ mollie_subscription_id: subData.id })
            .eq('mollie_payment_id', paymentId);
        } else {
          console.error('Failed to create subscription:', subData);
        }
      }
    }

    // Mollie expects a 200 response
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
