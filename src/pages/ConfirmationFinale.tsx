import { useAuth } from '@/contexts/AuthContext';

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

export default function ConfirmationFinale() {
  const { beneficiary } = useAuth();

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
      <Confetti />

      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-check-bounce" style={{ backgroundColor: '#98fb98' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Félicitations {beneficiary?.prenom} !</h1>
      <p className="text-muted-foreground leading-relaxed">
        Votre inscription au programme APTIF est confirmée. Un Expert APA va prendre contact avec vous prochainement pour votre entretien d'inclusion.
      </p>

      <div>
        <div style={{ borderTop: '1px solid #e8dfc4', margin: '24px 0' }} />
        <div className="text-center">
          <div style={{ fontSize: '32px' }}>📱</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2a2a2a' }}>
            Préparez votre programme
          </h2>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.7, margin: '10px 20px' }}>
            Votre rendez-vous d'inclusion avec un Expert APA sera l'occasion de finaliser votre programme personnalisé sur l'application APTIF. En attendant, téléchargez dès maintenant l'application pour la découvrir !
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <a
              href="https://apps.apple.com/ca/iphone/search?l=fr-CA&term=aptif"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#2a2a2a', color: 'white', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
              🍎 App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=digifit.android.virtuagym.pro.aptif"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#4a90e2', color: 'white', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
              ▶ Google Play
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
