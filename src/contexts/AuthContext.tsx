import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface BeneficiaryData {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: string;
  questionnaire_completed: boolean;
  subscription_active: boolean;
  date_inclusion: string;
  medecin_referent: string | null;
  preferences_communication: string[] | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  beneficiary: BeneficiaryData | null;
  loading: boolean;
  signUp: (email: string, password: string, nom: string, prenom: string, telephone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBeneficiary: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBeneficiary = async (userId: string) => {
    const { data } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', userId)
      .single();
    setBeneficiary(data);
  };

  const refreshBeneficiary = async () => {
    if (user) await fetchBeneficiary(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchBeneficiary(session.user.id);
      } else {
        setBeneficiary(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchBeneficiary(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nom: string, prenom: string, telephone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom, prenom } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Erreur lors de la création du compte");

    const userId = data.user.id;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role: 'beneficiary',
    });
    if (profileError) throw profileError;

    const { error: beneficiaryError } = await supabase.from('beneficiaries').insert({
      user_id: userId,
      nom,
      prenom,
      telephone,
      email,
      statut: 'en_pause',
      questionnaire_completed: false,
      subscription_active: false,
    });
    if (beneficiaryError) throw beneficiaryError;

    await fetchBeneficiary(userId);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setBeneficiary(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, beneficiary, loading, signUp, signIn, signOut, refreshBeneficiary }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
