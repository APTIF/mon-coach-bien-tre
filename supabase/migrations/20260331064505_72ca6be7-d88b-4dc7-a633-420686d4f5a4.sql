CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'beneficiary'
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  email text,
  preferences_communication text[],
  statut text DEFAULT 'en_pause',
  date_inclusion date DEFAULT current_date,
  medecin_referent text,
  questionnaire_completed boolean DEFAULT false,
  subscription_active boolean DEFAULT false,
  virtuagym_member_id text
);

CREATE TABLE IF NOT EXISTS questionnaire_inclusion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  consentement_donnees boolean,
  consentement_sante boolean,
  activite_actuelle text,
  freins text[],
  freins_autre text,
  objectifs text[],
  objectifs_autre text,
  motivation_score integer,
  temps_assis_par_jour text,
  moment_forme text,
  type_entrainement text,
  seances_par_semaine text,
  duree_ideale_seance text,
  a_materiel boolean,
  liste_materiel text,
  a_materiel_fc boolean,
  liste_materiel_fc text[],
  materiel_fc_autre text,
  a_pathologies boolean,
  liste_pathologies text[],
  pathologies_autre text,
  a_traitement boolean,
  liste_traitements text,
  a_douleurs boolean,
  description_douleurs text,
  a_test_effort boolean,
  resultats_test_effort text
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan text,
  statut text DEFAULT 'actif',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_inclusion ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "users own beneficiary" ON beneficiaries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users own questionnaire" ON questionnaire_inclusion
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);