import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

export default function Formules() {
  const { user, refreshBeneficiary, updateBeneficiary } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast.error('Paiement annulé. Vous pouvez réessayer.', {
        style: { background: '#ff7f7f', color: '#fff', border: 'none' },
      });
    }
  }, [searchParams]);

  const choosePlan = async (plan: string) => {
    if (!user) return;
    setLoading(plan);

    try {
      const { data, error } = await supabase.functions.invoke('create-mollie-payment', {
        body: {
          plan,
          user_id: user.id,
          redirect_base_url: window.location.origin,
        },
      });

      if (error) throw new Error(error.message || 'Erreur de paiement');
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('URL de paiement non disponible');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du paiement', {
        style: { background: '#ff7f7f', color: '#fff', border: 'none' },
      });
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
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'mensuel' ? <><Loader2 size={16} className="animate-spin" /> Traitement...</> : 'Choisir cette formule'}
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
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'programme_complet' ? <><Loader2 size={16} className="animate-spin" /> Traitement...</> : 'Choisir cette formule'}
          </button>
        </div>
      </div>

    </div>
  );
}
