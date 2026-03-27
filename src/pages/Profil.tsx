import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle, ClipboardList, CreditCard, Calendar, Save } from 'lucide-react';

export default function Profil() {
  const { beneficiary, user, refreshBeneficiary } = useAuth();
  const [editing, setEditing] = useState(false);
  const [telephone, setTelephone] = useState(beneficiary?.telephone || '');
  const [medecin, setMedecin] = useState(beneficiary?.medecin_referent || '');
  const [prefsCom, setPrefsCom] = useState<string[]>(beneficiary?.preferences_communication || []);
  const [saving, setSaving] = useState(false);

  if (!beneficiary) return null;

  const togglePref = (p: string) => {
    setPrefsCom(prev => prev.includes(p) ? prev.filter(v => v !== p) : [...prev, p]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('beneficiaries').update({
        telephone,
        medecin_referent: medecin || null,
        preferences_communication: prefsCom,
      }).eq('user_id', user.id);
      await refreshBeneficiary();
      setEditing(false);
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const statutColors: Record<string, string> = {
    actif: 'bg-success text-success-foreground',
    en_pause: 'bg-accent text-accent-foreground',
    'terminé': 'bg-destructive text-destructive-foreground',
  };

  const steps = [
    { label: 'Compte créé', done: true },
    { label: 'Questionnaire', done: beneficiary.questionnaire_completed },
    { label: 'Formule choisie', done: beneficiary.subscription_active },
    { label: 'RDV d\'inclusion', done: false },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-poppins focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm";

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{beneficiary.prenom} {beneficiary.nom}</h1>

      <div className="card-warm mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Statut</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statutColors[beneficiary.statut] || 'bg-muted'}`}>
            {beneficiary.statut}
          </span>
        </div>
        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm">{beneficiary.email}</span></div>

        {editing ? (
          <>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Téléphone</label>
              <input value={telephone} onChange={e => setTelephone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Médecin référent</label>
              <input value={medecin} onChange={e => setMedecin(e.target.value)} className={inputClass} placeholder="Nom du médecin" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Préférences de communication</label>
              <div className="flex flex-wrap gap-2">
                {['Téléphone', 'Mail', 'Whatsapp/Messages'].map(p => (
                  <button key={p} onClick={() => togglePref(p)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${prefsCom.includes(p) ? 'chip-selected' : 'chip-unselected'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
              <Save size={16} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Téléphone</span><span className="text-sm">{beneficiary.telephone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Médecin référent</span><span className="text-sm">{beneficiary.medecin_referent || '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Date d'inclusion</span><span className="text-sm">{beneficiary.date_inclusion}</span></div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Préférences de communication</span>
              <div className="flex flex-wrap gap-1">
                {(beneficiary.preferences_communication || []).map(p => (
                  <span key={p} className="text-xs bg-muted px-2 py-1 rounded-lg">{p}</span>
                ))}
                {(!beneficiary.preferences_communication || beneficiary.preferences_communication.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="w-full py-2.5 rounded-xl border border-primary text-primary text-sm font-medium">
              Modifier
            </button>
          </>
        )}
      </div>

      {/* Journey stepper */}
      <div className="card-warm">
        <h2 className="font-semibold mb-4">Progression du parcours</h2>
        <div className="space-y-1">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {s.done ? <CheckCircle size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 h-6 bg-border" />}
              </div>
              <p className={`text-sm ${s.done ? 'font-medium' : 'text-muted-foreground'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
