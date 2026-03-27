import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function Transition() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center mb-6 animate-check-bounce">
        <CheckCircle size={40} className="text-success-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Questionnaire complété !</h1>
      <p className="text-muted-foreground max-w-sm leading-relaxed mb-8">
        Merci d'avoir pris le temps de répondre à ces questions. Vous allez maintenant pouvoir choisir la formule la plus adaptée à vos besoins et démarrer votre programme APTIF.
      </p>
      <button onClick={() => navigate('/formules')} className="btn-primary max-w-sm flex items-center justify-center gap-2">
        Choisir ma formule <ArrowRight size={18} />
      </button>
    </div>
  );
}
