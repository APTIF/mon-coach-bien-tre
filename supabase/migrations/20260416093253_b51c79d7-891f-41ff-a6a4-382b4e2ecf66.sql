CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL,
  plan text,
  mollie_payment_id text,
  amount text,
  status text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment logs"
  ON public.payment_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payment logs"
  ON public.payment_logs FOR INSERT
  TO service_role
  WITH CHECK (true);