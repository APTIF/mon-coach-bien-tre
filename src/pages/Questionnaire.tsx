import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function RGPDSection() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <div
        className="bg-white rounded-xl p-3 border border-border"
        style={{ borderLeft: '3px solid #4a90e2' }}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#2a2a2a' }}>
            🔒 Politique de confidentialité APTIF
          </span>
          <span style={{ color: '#4a90e2', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
            {open ? '−' : '+'}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="pt-3" style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>
            <p className="mb-2">
              Vos données personnelles et de santé collectées dans ce questionnaire sont utilisées exclusivement par l'équipe APTIF dans le cadre de votre suivi en activité physique adaptée.
            </p>
            <p className="mb-2">
              Conformément au RGPD (Règlement Général sur la Protection des Données), vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour toute demande : contact@aptif.fr
            </p>
            <p>
              Vos données ne sont jamais transmises à des tiers sans votre consentement explicite.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

const TOTAL_STEPS = 11;

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        selected ? 'bg-primary text-white border-primary' : 'chip-unselected'
      }`}
    >
      {label}
    </button>
  );
}

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
        selected ? 'border-primary bg-primary text-white font-medium' : 'border-border bg-card'
      }`}
    >
      {label}
    </button>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => onChange(true)} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${value === true ? 'chip-selected' : 'chip-unselected'}`}>Oui</button>
      <button type="button" onClick={() => onChange(false)} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${value === false ? 'chip-selected' : 'chip-unselected'}`}>Non</button>
    </div>
  );
}

export default function Questionnaire() {
  const { beneficiary, refreshBeneficiary, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [consentDonnees, setConsentDonnees] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [prefsCom, setPrefsCom] = useState<string[]>(beneficiary?.preferences_communication || []);
  const [activite, setActivite] = useState('');
  const [freins, setFreins] = useState<string[]>([]);
  const [freinsAutre, setFreinsAutre] = useState('');
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [objectifsAutre, setObjectifsAutre] = useState('');
  const [motivation, setMotivation] = useState(5);
  const [tempsAssis, setTempsAssis] = useState('');
  const [momentForme, setMomentForme] = useState('');
  const [typeEntrainement, setTypeEntrainement] = useState('');
  const [seancesParSemaine, setSeancesParSemaine] = useState('');
  const [dureeIdeale, setDureeIdeale] = useState('');
  const [aMateriel, setAMateriel] = useState<boolean | null>(null);
  const [listeMateriel, setListeMateriel] = useState('');
  const [aMaterielFC, setAMaterielFC] = useState<boolean | null>(null);
  const [listeMaterielFC, setListeMaterielFC] = useState<string[]>([]);
  const [materielFCAutre, setMaterielFCAutre] = useState('');
  const [aPathologies, setAPathologies] = useState<boolean | null>(null);
  const [listePathologies, setListePathologies] = useState<string[]>([]);
  const [pathologiesAutre, setPathologiesAutre] = useState('');
  const [aTraitement, setATraitement] = useState<boolean | null>(null);
  const [listeTraitements, setListeTraitements] = useState('');
  const [aDouleurs, setADouleurs] = useState<boolean | null>(null);
  const [descriptionDouleurs, setDescriptionDouleurs] = useState('');
  const [aTestEffort, setATestEffort] = useState<boolean | null>(null);
  const [resultatsTestEffort, setResultatsTestEffort] = useState('');

  if (!beneficiary) return null;
  if (beneficiary.questionnaire_completed) {
    return <Navigate to="/formules" replace />;
  }

  const toggleArray = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const canProceed = () => {
    if (step === 1) return consentDonnees && consentSante;
    if (step === 3) return !!activite;
    return true;
  };

  const handleSubmit = async () => {
    if (!beneficiary) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('questionnaire_inclusion').insert({
        user_id: user!.id,
        consentement_donnees: consentDonnees,
        consentement_sante: consentSante,
        activite_actuelle: activite,
        freins,
        freins_autre: freinsAutre || null,
        objectifs,
        objectifs_autre: objectifsAutre || null,
        motivation_score: motivation,
        temps_assis_par_jour: tempsAssis,
        moment_forme: momentForme,
        type_entrainement: typeEntrainement,
        seances_par_semaine: seancesParSemaine,
        duree_ideale_seance: dureeIdeale,
        a_materiel: aMateriel ?? false,
        liste_materiel: listeMateriel || null,
        a_materiel_fc: aMaterielFC ?? false,
        liste_materiel_fc: listeMaterielFC.length > 0 ? listeMaterielFC : null,
        materiel_fc_autre: materielFCAutre || null,
        a_pathologies: aPathologies ?? false,
        liste_pathologies: listePathologies.length > 0 ? listePathologies : null,
        pathologies_autre: pathologiesAutre || null,
        a_traitement: aTraitement ?? false,
        liste_traitements: listeTraitements || null,
        a_douleurs: aDouleurs ?? false,
        description_douleurs: descriptionDouleurs || null,
        a_test_effort: aTestEffort ?? false,
        resultats_test_effort: resultatsTestEffort || null,
      });
      if (error) throw error;

      // Update preferences and questionnaire_completed
      await supabase.from('beneficiaries').update({
        questionnaire_completed: true,
        preferences_communication: prefsCom,
      }).eq('user_id', user!.id);

      // Send email notification (fail silently)
      try {
        await supabase.functions.invoke('send-questionnaire-email', {
          body: {
            nom: beneficiary.nom,
            prenom: beneficiary.prenom,
            email: beneficiary.email,
            telephone: beneficiary.telephone,
            preferences_communication: prefsCom,
            activite_actuelle: activite,
            freins,
            freins_autre: freinsAutre || null,
            objectifs,
            objectifs_autre: objectifsAutre || null,
            motivation_score: motivation,
            temps_assis_par_jour: tempsAssis,
            moment_forme: momentForme,
            type_entrainement: typeEntrainement,
            seances_par_semaine: seancesParSemaine,
            duree_ideale_seance: dureeIdeale,
            a_materiel: aMateriel ?? false,
            liste_materiel: listeMateriel || null,
            a_materiel_fc: aMaterielFC ?? false,
            liste_materiel_fc: listeMaterielFC.length > 0 ? listeMaterielFC : null,
            materiel_fc_autre: materielFCAutre || null,
            a_pathologies: aPathologies ?? false,
            liste_pathologies: listePathologies.length > 0 ? listePathologies : null,
            pathologies_autre: pathologiesAutre || null,
            a_traitement: aTraitement ?? false,
            liste_traitements: listeTraitements || null,
            a_douleurs: aDouleurs ?? false,
            description_douleurs: descriptionDouleurs || null,
            a_test_effort: aTestEffort ?? false,
            resultats_test_effort: resultatsTestEffort || null,
          },
        });
      } catch {
        // Fail silently — email not blocking
      }

      await refreshBeneficiary();
      navigate('/transition');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-poppins focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm";

  return (
    <div className="min-h-screen px-4 py-8 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-primary text-center mb-2">Questionnaire d'inclusion</h1>

      <RGPDSection />

      {/* Progress */}
      <div className="mb-6">
        <p className="text-center text-sm text-muted-foreground mb-2">Étape {step} sur {TOTAL_STEPS}</p>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <div className="card-warm min-h-[300px]">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Consentement</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentDonnees} onChange={e => setConsentDonnees(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-primary" />
              <span className="text-sm leading-relaxed">Je reconnais avoir pris connaissance des informations relatives à la protection des données et consens au traitement de mes données personnelles dans le cadre de mon accompagnement APTIF.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consentSante} onChange={e => setConsentSante(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-primary" />
              <span className="text-sm leading-relaxed">Je consens expressément au traitement de mes données de santé communiquées dans ce questionnaire afin de permettre l'adaptation sécurisée de mon programme d'activité physique.</span>
            </label>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Identité</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground text-sm">Nom</span><span className="text-sm font-medium">{beneficiary.nom}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground text-sm">Prénom</span><span className="text-sm font-medium">{beneficiary.prenom}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground text-sm">Email</span><span className="text-sm font-medium">{beneficiary.email}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground text-sm">Téléphone</span><span className="text-sm font-medium">{beneficiary.telephone}</span></div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Préférences de communication</p>
              <div className="flex flex-wrap gap-2">
                {['Téléphone', 'Mail', 'Whatsapp/Messages'].map(p => (
                  <Chip key={p} label={p} selected={prefsCom.includes(p)} onClick={() => toggleArray(prefsCom, p, setPrefsCom)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Pratiquez-vous une activité physique actuellement ?</h2>
            {['Aucune', 'Occasionnelle (moins d\'1 fois/semaine)', 'Régulière (1 à 2 fois/semaine)', 'Fréquente (plus de 3 fois/semaine)'].map(o => (
              <RadioOption key={o} label={o} selected={activite === o} onClick={() => setActivite(o)} />
            ))}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Qu'est-ce qui vous freine actuellement dans la pratique d'une activité physique ?</h2>
            <div className="flex flex-wrap gap-2">
              {['Manque de temps', 'Fatigue/douleurs', 'Manque de motivation', 'Peur de mal faire', 'Je ne sais pas par où commencer', 'Autre'].map(f => (
                <Chip key={f} label={f} selected={freins.includes(f)} onClick={() => toggleArray(freins, f, setFreins)} />
              ))}
            </div>
            {freins.includes('Autre') && <input placeholder="Précisez..." value={freinsAutre} onChange={e => setFreinsAutre(e.target.value)} className={inputClass} />}
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Pourquoi souhaitez-vous démarrer un programme d'activité physique ?</h2>
            <div className="flex flex-wrap gap-2">
              {['Améliorer ma santé', 'Retrouver de l\'énergie', 'Réduire mes douleurs', 'Mieux vivre avec ma maladie', 'Reprendre confiance en mon corps', 'Être moins essoufflé', 'Autre'].map(o => (
                <Chip key={o} label={o} selected={objectifs.includes(o)} onClick={() => toggleArray(objectifs, o, setObjectifs)} />
              ))}
            </div>
            {objectifs.includes('Autre') && <input placeholder="Précisez..." value={objectifsAutre} onChange={e => setObjectifsAutre(e.target.value)} className={inputClass} />}
          </div>
        )}

        {/* Step 6 */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Sur une échelle de 0 à 10, à quel point êtes-vous motivé(e) à démarrer ce programme ?</h2>
            <div className="space-y-2">
              <input type="range" min={0} max={10} value={motivation} onChange={e => setMotivation(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span className="text-lg font-bold text-primary">{motivation}</span><span>10</span></div>
            </div>
          </div>
        )}

        {/* Step 7 */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Mode de vie</h2>
              <p className="text-sm font-medium">En moyenne, combien d'heures passez-vous assis(e) par jour ?</p>
              {['Moins de 4h', '4 à 6h', 'Plus de 6h', 'Je ne sais pas'].map(o => (
                <RadioOption key={o} label={o} selected={tempsAssis === o} onClick={() => setTempsAssis(o)} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">À quels moments de la journée vous sentez-vous le (la) plus en forme pour bouger ?</p>
              {['Matin', 'Après-midi', 'Soirée', 'Variable'].map(o => (
                <RadioOption key={o} label={o} selected={momentForme === o} onClick={() => setMomentForme(o)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 8 */}
        {step === 8 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">Préférences d'entraînement</h2>
            <div className="space-y-3">
              <p className="text-sm font-medium">Quel type d'entraînement préférez-vous ou souhaiteriez-vous découvrir ?</p>
              {['Renforcement musculaire', 'Endurance', 'Renforcement + Endurance', 'Équilibre', 'Souplesse/Mobilité', 'Je ne sais pas encore'].map(o => (
                <RadioOption key={o} label={o} selected={typeEntrainement === o} onClick={() => setTypeEntrainement(o)} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Combien de séances d'activité physique par semaine souhaiteriez-vous réaliser ?</p>
              <div className="flex flex-wrap gap-2">
                {['1', '2', '3', '4 ou plus', 'Je ne sais pas'].map(o => (
                  <Chip key={o} label={o} selected={seancesParSemaine === o} onClick={() => setSeancesParSemaine(o)} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Quelle est pour vous la durée idéale d'une séance d'activité physique ?</p>
              {['Moins de 15 min', '15 à 30 min', 'Plus de 30 min', 'Je ne sais pas'].map(o => (
                <RadioOption key={o} label={o} selected={dureeIdeale === o} onClick={() => setDureeIdeale(o)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 9 */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Matériel d'exercice</h2>
            <p className="text-sm text-muted-foreground">Avez-vous du matériel pour réaliser des exercices ?</p>
            <YesNo value={aMateriel} onChange={setAMateriel} />
            {aMateriel && <input placeholder="Liste du matériel disponible" value={listeMateriel} onChange={e => setListeMateriel(e.target.value)} className={inputClass} />}
          </div>
        )}

        {/* Step 10 */}
        {step === 10 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Matériel fréquence cardiaque</h2>
            <p className="text-sm text-muted-foreground">Avez-vous du matériel pour mesurer votre fréquence cardiaque ?</p>
            <YesNo value={aMaterielFC} onChange={setAMaterielFC} />
            {aMaterielFC && (
              <div className="flex flex-wrap gap-2">
                {['Montre connectée', 'Ceinture cardio-thoracique', 'Saturomètre/oxymètre de pouls', 'Tensiomètre', 'Autre'].map(m => (
                  <Chip key={m} label={m} selected={listeMaterielFC.includes(m)} onClick={() => toggleArray(listeMaterielFC, m, setListeMaterielFC)} />
                ))}
              </div>
            )}
            {aMaterielFC && listeMaterielFC.includes('Autre') && (
              <input placeholder="Précisez..." value={materielFCAutre} onChange={e => setMaterielFCAutre(e.target.value)} className={inputClass} />
            )}
          </div>
        )}

        {/* Step 11 */}
        {step === 11 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">Informations médicales</h2>
            <div className="bg-accent/20 border border-accent rounded-xl p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cette partie est facultative. Elle permet un accompagnement plus personnalisé et sécurisé. Vos informations sont confidentielles.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Avez-vous une ou plusieurs pathologies connues ?</p>
              <YesNo value={aPathologies} onChange={setAPathologies} />
              {aPathologies && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {['Maladie cardiovasculaire', 'Maladie respiratoire', 'Diabète', 'Cancer(s)', 'Arthrose/Douleurs articulaires', 'Troubles neurologiques', 'Autre'].map(p => (
                      <Chip key={p} label={p} selected={listePathologies.includes(p)} onClick={() => toggleArray(listePathologies, p, setListePathologies)} />
                    ))}
                  </div>
                  {listePathologies.includes('Autre') && <input placeholder="Précisez..." value={pathologiesAutre} onChange={e => setPathologiesAutre(e.target.value)} className={inputClass} />}
                </>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Suivez-vous un traitement médical régulier ?</p>
              <YesNo value={aTraitement} onChange={setATraitement} />
              {aTraitement && <input placeholder="Décrivez votre traitement" value={listeTraitements} onChange={e => setListeTraitements(e.target.value)} className={inputClass} />}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Avez-vous des douleurs et/ou gênes persistantes ?</p>
              <YesNo value={aDouleurs} onChange={setADouleurs} />
              {aDouleurs && <input placeholder="Décrivez vos douleurs" value={descriptionDouleurs} onChange={e => setDescriptionDouleurs(e.target.value)} className={inputClass} />}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Avez-vous réalisé un test d'effort au cours des 12 derniers mois ?</p>
              <YesNo value={aTestEffort} onChange={setATestEffort} />
              {aTestEffort && <textarea placeholder="Résultats (FCm, Watts, VO2max, conclusion...)" value={resultatsTestEffort} onChange={e => setResultatsTestEffort(e.target.value)} className={inputClass + ' min-h-[80px]'} />}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Précédent
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
          >
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {submitting ? 'Envoi...' : 'Terminer'}
          </button>
        )}
      </div>
    </div>
  );
}
