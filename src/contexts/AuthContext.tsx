import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface BeneficiaryData {
  id: string;
  user_id: string;
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
  updateBeneficiary: (updates: Partial<BeneficiaryData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isMockMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

const MOCK_USER_ID = 'mock-user-001';

function getMockBeneficiary(): BeneficiaryData {
  const stored = localStorage.getItem('mock_beneficiary');
  if (stored) return JSON.parse(stored);
  return {
    id: 'mock-ben-001',
    user_id: MOCK_USER_ID,
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0612345678',
    email: 'test@aptif.fr',
    statut: 'en_pause',
    questionnaire_completed: false,
    subscription_active: false,
    date_inclusion: new Date().toISOString().split('T')[0],
    medecin_referent: null,
    preferences_communication: null,
  };
}

function saveMockBeneficiary(b: BeneficiaryData) {
  localStorage.setItem('mock_beneficiary', JSON.stringify(b));
}

const MOCK_USER = { id: MOCK_USER_ID, email: 'test@aptif.fr' } as User;
const MOCK_SESSION = { user: MOCK_USER } as Session;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const updateBeneficiary = (updates: Partial<BeneficiaryData>) => {
    setBeneficiary(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (isMockMode) saveMockBeneficiary(updated);
      return updated;
    });
  };

  // --- MOCK MODE ---
  useEffect(() => {
    if (isMockMode) {
      const wasMocked = localStorage.getItem('mock_logged_in') === 'true';
      if (wasMocked) {
        setSession(MOCK_SESSION);
        setUser(MOCK_USER);
        setBeneficiary(getMockBeneficiary());
      }
      setLoading(false);
      return;
    }

    // --- REAL SUPABASE MODE ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('beneficiaries').select('*').eq('user_id', session.user.id).single();
        setBeneficiary(data);
      } else {
        setBeneficiary(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('beneficiaries').select('*').eq('user_id', session.user.id).single().then(({ data }) => setBeneficiary(data));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isMockMode) {
      localStorage.setItem('mock_logged_in', 'true');
      const b = getMockBeneficiary();
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setBeneficiary(b);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nom: string, prenom: string, telephone: string) => {
    if (isMockMode) {
      const b: BeneficiaryData = {
        id: 'mock-ben-' + Date.now(),
        user_id: MOCK_USER_ID,
        nom,
        prenom,
        telephone,
        email,
        statut: 'en_pause',
        questionnaire_completed: false,
        subscription_active: false,
        date_inclusion: new Date().toISOString().split('T')[0],
        medecin_referent: null,
        preferences_communication: null,
      };
      saveMockBeneficiary(b);
      localStorage.setItem('mock_logged_in', 'true');
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setBeneficiary(b);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nom, prenom } } });
    if (error) throw error;
    if (!data.user) throw new Error("Erreur lors de la création du compte");
    const userId = data.user.id;
    await supabase.from('profiles').insert({ id: userId, role: 'beneficiary' });
    await supabase.from('beneficiaries').insert({ user_id: userId, nom, prenom, telephone, email, statut: 'en_pause', questionnaire_completed: false, subscription_active: false });
    const { data: benData } = await supabase.from('beneficiaries').select('*').eq('user_id', userId).single();
    setBeneficiary(benData);
  };

  const signOut = async () => {
    if (isMockMode) {
      localStorage.removeItem('mock_logged_in');
      localStorage.removeItem('mock_beneficiary');
    } else {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setBeneficiary(null);
  };

  const refreshBeneficiary = async () => {
    if (isMockMode) {
      setBeneficiary(getMockBeneficiary());
      return;
    }
    if (user) {
      const { data } = await supabase.from('beneficiaries').select('*').eq('user_id', user.id).single();
      setBeneficiary(data);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, beneficiary, loading, signUp, signIn, signOut, refreshBeneficiary, updateBeneficiary }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
