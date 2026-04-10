ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS mollie_customer_id text,
ADD COLUMN IF NOT EXISTS mollie_subscription_id text;