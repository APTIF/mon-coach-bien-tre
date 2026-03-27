import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TestToolbar() {
  const { user, refreshBeneficiary } = useAuth();
  const navigate = useNavigate();

  if (import.meta.env.PROD || !user) return null;

  const resetParcours = async () => {
    await supabase.from('beneficiaries').update({
      questionnaire_completed: false,
      subscription_active: false,
      statut: 'en_pause',
    }).eq('user_id', user.id);
    await supabase.from('questionnaire_inclusion').delete().eq('user_id', user.id);
    await supabase.from('subscriptions').delete().eq('user_id', user.id);
    await refreshBeneficiary();
    navigate('/accueil');
  };

  const skipQuestionnaire = async () => {
    await supabase.from('beneficiaries').update({ questionnaire_completed: true }).eq('user_id', user.id);
    await refreshBeneficiary();
    navigate('/formules');
  };

  const skipPayment = async () => {
    await supabase.from('beneficiaries').update({
      subscription_active: true,
      statut: 'actif',
    }).eq('user_id', user.id);
    await refreshBeneficiary();
    navigate('/confirmation');
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center gap-2 px-4 pb-2">
      <button onClick={resetParcours} className="bg-destructive text-destructive-foreground text-xs px-3 py-1.5 rounded-lg font-medium opacity-70 hover:opacity-100">
        Reset parcours
      </button>
      <button onClick={skipQuestionnaire} className="bg-accent text-accent-foreground text-xs px-3 py-1.5 rounded-lg font-medium opacity-70 hover:opacity-100">
        Passer questionnaire
      </button>
      <button onClick={skipPayment} className="bg-success text-success-foreground text-xs px-3 py-1.5 rounded-lg font-medium opacity-70 hover:opacity-100">
        Passer paiement
      </button>
    </div>
  );
}
