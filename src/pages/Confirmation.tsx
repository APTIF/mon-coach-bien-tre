import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PartyPopper, Calendar } from 'lucide-react';

function Confetti() {
  const colors = ['hsl(213, 72%, 59%)', 'hsl(49, 93%, 48%)', 'hsl(120, 100%, 80%)', 'hsl(0, 100%, 75%)'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm animate-confetti-fall"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Confirmation() {
  const { beneficiary } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <Confetti />

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4 animate-check-bounce">
          <PartyPopper size={32} className="text-success-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Félicitations {beneficiary?.prenom} !</h1>
        <p className="text-muted-foreground leading-relaxed">
          Votre inscription au programme APTIF est confirmée. Un Expert APA va prendre contact avec vous prochainement pour votre entretien d'inclusion.
        </p>
      </div>

      <div className="card-warm mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={20} className="text-primary" />
          <h2 className="font-semibold">Prendre mon rendez-vous d'inclusion</h2>
        </div>
        <div className="bg-muted rounded-xl p-6 text-center mb-3">
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="font-medium">{d}</span>)}
          </div>
          {Array.from({ length: 5 }).map((_, week) => (
            <div key={week} className="grid grid-cols-7 gap-1 text-xs">
              {Array.from({ length: 7 }).map((_, day) => {
                const num = week * 7 + day + 1;
                return num <= 31 ? (
                  <span key={day} className="py-1 rounded text-muted-foreground">{num}</span>
                ) : <span key={day} />;
              })}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          La prise de rendez-vous en ligne sera disponible très prochainement. Nous vous contacterons par téléphone pour convenir d'un créneau.
        </p>
      </div>

      <button onClick={() => navigate('/profil')} className="btn-primary">
        Accéder à mon profil
      </button>
    </div>
  );
}
