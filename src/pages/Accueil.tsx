import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, ArrowRight, ClipboardList, CreditCard, Calendar } from 'lucide-react';

export default function Accueil() {
  const navigate = useNavigate();
  const { beneficiary } = useAuth();

  const steps = [
    { label: 'Création de votre compte', icon: CheckCircle, done: true, desc: '' },
    { label: 'Questionnaire d\'inclusion', icon: ClipboardList, done: beneficiary?.questionnaire_completed, desc: 'Répondez à quelques questions pour nous permettre de mieux vous connaître.' },
    { label: 'Choix de votre formule', icon: CreditCard, done: beneficiary?.subscription_active, desc: 'Sélectionnez la formule adaptée à vos besoins.' },
    { label: 'Prise de rendez-vous', icon: Calendar, done: false, desc: 'Échangez avec un Expert APA pour finaliser votre programme personnalisé.' },
  ];

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <img src="/aptif-logo.png" alt="APTIF" className="mx-auto" style={{ maxHeight: '64px', width: 'auto' }} />
      </div>

      {/* Qui sommes-nous */}
      <div className="card-warm mb-8">
        <h2 className="text-lg font-semibold mb-3">Qui sommes-nous ?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          APTIF est un programme d'Activité Physique Adaptée conçu pour les personnes en phase de post-réhabilitation (phase 3). Notre objectif : vous accompagner vers une reprise progressive, sécurisée et personnalisée de l'activité physique, en lien avec votre parcours de soin.
        </p>
      </div>

      {/* Stepper */}
      <div className="card-warm mb-8">
        <h2 className="text-lg font-semibold mb-5">Votre parcours en 4 étapes</h2>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? <CheckCircle size={18} /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 h-8 bg-border" />}
              </div>
              <div className="pb-4">
                <p className={`font-semibold text-sm ${step.done ? 'text-success-foreground' : ''}`}>
                  {step.label}
                </p>
                {step.desc && <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!beneficiary?.questionnaire_completed && (
        <button onClick={() => navigate('/questionnaire')} className="btn-primary flex items-center justify-center gap-2">
          Commencer mon questionnaire <ArrowRight size={18} />
        </button>
      )}
      {beneficiary?.questionnaire_completed && !beneficiary?.subscription_active && (
        <button onClick={() => navigate('/formules')} className="btn-primary flex items-center justify-center gap-2">
          Choisir ma formule <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
