import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Auth() {
  const { user, beneficiary, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && beneficiary) {
    if (!beneficiary.questionnaire_completed) return <Navigate to="/accueil" replace />;
    if (!beneficiary.subscription_active) return <Navigate to="/formules" replace />;
    return <Navigate to="/confirmation" replace />;
  }

  const getRedirectPath = (b: typeof beneficiary) => {
    if (!b) return '/accueil';
    if (!b.questionnaire_completed) return '/accueil';
    if (!b.subscription_active) return '/formules';
    return '/confirmation';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(loginEmail, loginPassword);
      // Auth state change will handle redirect via the Navigate above on re-render
      // But we need to wait for beneficiary to load
      setTimeout(() => {
        navigate('/accueil');
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, nom, prenom, telephone);
      navigate('/accueil');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestLogin = async () => {
    setSubmitting(true);
    try {
      await signIn('test@aptif.fr', 'Test1234!');
      setTimeout(() => navigate('/accueil'), 500);
    } catch {
      toast.error('Compte test non trouvé. Créez-le manuellement.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-poppins focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">APTIF</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Votre programme d'activité physique adapté à votre santé
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Mot de passe" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={inputClass} />
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <input type="text" placeholder="Prénom" required value={prenom} onChange={e => setPrenom(e.target.value)} className={inputClass} />
            <input type="text" placeholder="Nom" required value={nom} onChange={e => setNom(e.target.value)} className={inputClass} />
            <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="Téléphone" required value={telephone} onChange={e => setTelephone(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Mot de passe (min. 8 caractères)" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Confirmer le mot de passe" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}

        {/* Test login */}
        {!import.meta.env.PROD && (
          <button
            onClick={handleTestLogin}
            disabled={submitting}
            className="mt-4 w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Connexion test (test@aptif.fr)
          </button>
        )}
      </div>
    </div>
  );
}
