import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PartyPopper, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VirtuagymEvent {
  id: number | string;
  title?: string;
  timestamp_start?: number;
  start?: string;
  date?: string;
  time?: string;
}

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

function formatEventDate(event: VirtuagymEvent): string {
  if (event.timestamp_start) {
    const d = new Date(event.timestamp_start * 1000);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  if (event.start) return new Date(event.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return event.date || '';
}

function formatEventTime(event: VirtuagymEvent): string {
  if (event.timestamp_start) {
    const d = new Date(event.timestamp_start * 1000);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (event.start) return new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return event.time || '';
}

export default function Confirmation() {
  const { beneficiary, refreshBeneficiary, user, updateBeneficiary } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState<VirtuagymEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | number | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<VirtuagymEvent | null>(null);
  const [eventsError, setEventsError] = useState(false);

  const isMockMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

  // Verify payment on arrival
  useEffect(() => {
    if (searchParams.get('payment') === 'success' && user && !isMockMode) {
      supabase.functions.invoke('verify-mollie-payment', {
        body: { user_id: user.id },
      }).then(() => refreshBeneficiary());
    }
    if (searchParams.get('payment') === 'success' && isMockMode) {
      updateBeneficiary({ subscription_active: true, statut: 'actif' });
    }
  }, []);

  // Fetch Virtuagym events
  useEffect(() => {
    async function fetchEvents() {
      if (isMockMode) {
        setEvents([]);
        setLoadingEvents(false);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('get-virtuagym-events');
        if (error) throw error;
        setEvents(data?.events || []);
      } catch {
        setEventsError(true);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  const handleBooking = async () => {
    if (!selectedEvent || !beneficiary) return;
    setBooking(true);
    try {
      const { data, error } = await supabase.functions.invoke('book-virtuagym-event', {
        body: {
          event_id: selectedEvent,
          member_id: (beneficiary as any).virtuagym_member_id,
        },
      });
      if (error) throw error;
      const ev = events.find(e => e.id === selectedEvent);
      setBooked(ev || null);
      toast.success('Rendez-vous confirmé !');
    } catch {
      toast.error('Erreur lors de la réservation. Nous vous contacterons par téléphone.');
    } finally {
      setBooking(false);
    }
  };

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
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={20} className="text-primary" />
          <h2 className="font-semibold">Prendre mon rendez-vous d'inclusion</h2>
        </div>

        {booked ? (
          <div className="rounded-xl p-4 text-center" style={{ background: '#f0f7ff', border: '1px solid #4a90e2' }}>
            <p className="font-medium text-sm">
              Votre rendez-vous est confirmé pour le {formatEventDate(booked)} à {formatEventTime(booked)}. À très bientôt !
            </p>
          </div>
        ) : loadingEvents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : eventsError || events.length === 0 ? (
          <div className="rounded-xl p-4 bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              Aucun créneau disponible pour le moment. Nous vous contacterons par téléphone.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium mb-3">Créneaux disponibles :</p>
            <div className="space-y-2 mb-4">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    border: selectedEvent === event.id ? '2px solid #4a90e2' : '1px solid #e8dfc4',
                    background: selectedEvent === event.id ? '#f0f7ff' : 'transparent',
                  }}
                >
                  <span className="font-medium capitalize">{formatEventDate(event)}</span>
                  <span className="text-muted-foreground"> — {formatEventTime(event)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleBooking}
              disabled={!selectedEvent || booking}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4a90e2' }}
            >
              {booking ? <><Loader2 size={16} className="animate-spin" /> Réservation...</> : 'Confirmer ce créneau'}
            </button>
          </>
        )}
      </div>

      <button onClick={() => navigate('/profil')} className="btn-primary">
        Accéder à mon profil
      </button>
    </div>
  );
}
