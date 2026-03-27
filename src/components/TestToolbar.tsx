import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TestToolbar() {
  const { user, updateBeneficiary } = useAuth();
  const navigate = useNavigate();

  if (import.meta.env.PROD || !user) return null;

  const resetParcours = () => {
    updateBeneficiary({
      questionnaire_completed: false,
      subscription_active: false,
      statut: 'en_pause',
    });
    navigate('/accueil');
  };

  const skipQuestionnaire = () => {
    updateBeneficiary({ questionnaire_completed: true });
    navigate('/formules');
  };

  const skipPayment = () => {
    updateBeneficiary({
      subscription_active: true,
      statut: 'actif',
    });
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
