const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await req.json();

    const fmt = (v: any) => {
      if (v === null || v === undefined) return '—';
      if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
      if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : '—';
      return String(v);
    };

    const subject = `Nouveau questionnaire — ${data.prenom} ${data.nom}`;
    const html = `
      <h2>Nouveau questionnaire d'inclusion soumis</h2>

      <h3>IDENTITÉ</h3>
      <p><strong>Nom :</strong> ${fmt(data.nom)}</p>
      <p><strong>Prénom :</strong> ${fmt(data.prenom)}</p>
      <p><strong>Email :</strong> ${fmt(data.email)}</p>
      <p><strong>Téléphone :</strong> ${fmt(data.telephone)}</p>
      <p><strong>Préférences de communication :</strong> ${fmt(data.preferences_communication)}</p>

      <h3>ACTIVITÉ PHYSIQUE</h3>
      <p><strong>Activité actuelle :</strong> ${fmt(data.activite_actuelle)}</p>
      <p><strong>Freins :</strong> ${fmt(data.freins)} ${data.freins_autre ? '/ ' + data.freins_autre : ''}</p>
      <p><strong>Objectifs :</strong> ${fmt(data.objectifs)} ${data.objectifs_autre ? '/ ' + data.objectifs_autre : ''}</p>
      <p><strong>Motivation :</strong> ${fmt(data.motivation_score)}/10</p>

      <h3>MODE DE VIE</h3>
      <p><strong>Temps assis :</strong> ${fmt(data.temps_assis_par_jour)}</p>
      <p><strong>Moment de forme :</strong> ${fmt(data.moment_forme)}</p>

      <h3>ENTRAÎNEMENT</h3>
      <p><strong>Type :</strong> ${fmt(data.type_entrainement)}</p>
      <p><strong>Séances/semaine :</strong> ${fmt(data.seances_par_semaine)}</p>
      <p><strong>Durée idéale :</strong> ${fmt(data.duree_ideale_seance)}</p>

      <h3>MATÉRIEL</h3>
      <p><strong>Matériel exercice :</strong> ${fmt(data.a_materiel)} — ${fmt(data.liste_materiel)}</p>
      <p><strong>Matériel FC :</strong> ${fmt(data.a_materiel_fc)} — ${fmt(data.liste_materiel_fc)} ${data.materiel_fc_autre ? '/ ' + data.materiel_fc_autre : ''}</p>

      <h3>INFORMATIONS MÉDICALES</h3>
      <p><strong>Pathologies :</strong> ${fmt(data.a_pathologies)} — ${fmt(data.liste_pathologies)} ${data.pathologies_autre ? '/ ' + data.pathologies_autre : ''}</p>
      <p><strong>Traitements :</strong> ${fmt(data.a_traitement)} — ${fmt(data.liste_traitements)}</p>
      <p><strong>Douleurs :</strong> ${fmt(data.a_douleurs)} — ${fmt(data.description_douleurs)}</p>
      <p><strong>Test d'effort :</strong> ${fmt(data.a_test_effort)} — ${fmt(data.resultats_test_effort)}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'APTIF <noreply@aptif.fr>',
        to: ['contact@aptif.fr'],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: result }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
