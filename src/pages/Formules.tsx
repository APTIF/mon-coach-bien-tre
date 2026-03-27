import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export default function Formules() {
  const { user, refreshBeneficiary } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const choosePlan = async (plan: string) => {
    if (!user) return;
    setLoading(plan);
    try {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan,
        statut: 'actif',
      });
      await supabase.from('beneficiaries').update({
        subscription_active: true,
        statut: 'actif',
      }).eq('user_id', user.id);
      await refreshBeneficiary();
      navigate('/confirmation');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-primary text-center mb-2">Choisissez votre formule</h1>
      <p className="text-center text-sm text-muted-foreground mb-8">Sélectionnez l'offre qui correspond à vos besoins</p>

      <div className="space-y-5">
        {/* Card 1 */}
        <div className="card-warm">
          <h2 className="text-xl font-bold mb-1">Démarrage</h2>
          <p className="text-3xl font-bold text-primary mb-3">15€</p>
          <p className="text-sm text-muted-foreground mb-5">Accès app 4 semaines + programme APA standard</p>
          <button
            onClick={() => choosePlan('mensuel')}
            disabled={loading !== null}
            className="btn-primary disabled:opacity-50"
          >
            {loading === 'mensuel' ? 'Traitement...' : 'Choisir cette formule'}
          </button>
        </div>

        {/* Card 2 */}
        <div className="card-warm relative border-2 border-primary">
          <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star size={12} /> Recommandé
          </div>
          <h2 className="text-xl font-bold mb-1">Accompagnement</h2>
          <p className="text-3xl font-bold text-primary mb-1">25€<span className="text-base font-normal text-muted-foreground">/mois × 6 mois</span></p>
          <p className="text-sm text-muted-foreground mb-5">Accès app PRO + programme sur mesure + entretien EAPA toutes les 4 semaines</p>
          <button
            onClick={() => choosePlan('programme_complet')}
            disabled={loading !== null}
            className="btn-primary disabled:opacity-50"
          >
            {loading === 'programme_complet' ? 'Traitement...' : 'Choisir cette formule'}
          </button>
        </div>
      </div>
    </div>
  );
}
