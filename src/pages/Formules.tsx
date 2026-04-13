import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

export default function Formules() {
  const { user, beneficiary } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [accompagnementMode, setAccompagnementMode] = useState<'mensuel' | 'total'>('mensuel');

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
          user_email: beneficiary?.email || user.email,
          user_name: beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}`.trim() : '',
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

  const accompagnementPlan = accompagnementMode === 'mensuel' ? 'accompagnement_mensuel' : 'accompagnement_total';

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-primary text-center mb-2">Choisissez votre formule</h1>
      <p className="text-center text-sm text-muted-foreground mb-8">Sélectionnez l'offre qui correspond à vos besoins</p>

      <div className="space-y-5">
        {/* Card 1 — Démarrage */}
        <div className="card-warm">
          <h2 className="text-xl font-bold mb-1">Démarrage</h2>
          <p className="text-3xl font-bold text-primary mb-3">15€</p>
          <p className="text-sm text-muted-foreground mb-5">Accès à l'application APTIF + programme APA standard de 4 semaines</p>
          <button
            onClick={() => choosePlan('mensuel')}
            disabled={loading !== null}
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'mensuel' ? <><Loader2 size={16} className="animate-spin" /> Traitement...</> : 'Choisir cette formule'}
          </button>
        </div>

        {/* Card 2 — Accompagnement */}
        <div className="card-warm relative border-2 border-primary">
          <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star size={12} /> Recommandé
          </div>
          <h2 className="text-xl font-bold mb-1">Accompagnement</h2>
          
          {/* Dynamic price display */}
          {accompagnementMode === 'mensuel' ? (
            <p className="text-3xl font-bold text-primary mb-1">25€<span className="text-lg font-medium text-muted-foreground">/mois × 6 mois</span></p>
          ) : (
            <div className="mb-1">
              <p className="text-3xl font-bold text-primary">140€</p>
              <p className="text-sm text-muted-foreground">en une fois</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">Accès app PRO + programme sur mesure + entretien EAPA toutes les 4 semaines</p>

          {/* Payment mode toggle */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setAccompagnementMode('mensuel')}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                border: accompagnementMode === 'mensuel' ? '2px solid #4a90e2' : '1px solid #e8dfc4',
                background: accompagnementMode === 'mensuel' ? '#f0f7ff' : 'white',
              }}
            >
              <span className="block text-sm font-bold">25€/mois × 6 mois</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Prélevé automatiquement chaque mois</span>
            </button>
            <button
              type="button"
              onClick={() => setAccompagnementMode('total')}
              className="rounded-xl p-3 text-left transition-all relative"
              style={{
                border: accompagnementMode === 'total' ? '2px solid #4a90e2' : '1px solid #e8dfc4',
                background: accompagnementMode === 'total' ? '#f0f7ff' : 'white',
              }}
            >
              <span className="absolute -top-2 right-2 text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Flexibilité maximale</span>
              <span className="block text-sm font-bold">140€ en une fois</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Paiement unique</span>
            </button>
          </div>

          <button
            onClick={() => choosePlan(accompagnementPlan)}
            disabled={loading !== null}
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === accompagnementPlan ? (
              <><Loader2 size={16} className="animate-spin" /> Traitement...</>
            ) : (
              'Choisir cette formule'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
