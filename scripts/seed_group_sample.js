const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function toUUID(str) {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const h = crypto.createHash('md5').update(str).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function seedSampleGroups() {
  console.log('🔄 Ajout de groupes de discussion exemples...');

  const adminId1 = '49c62aaa-f619-dfd0-b4d1-1178db7cb5da';
  const adminId2 = 'd96200a9-1d69-4e6a-aaf4-6160ce174894';
  const techId = toUUID('usr-technique');
  const ctOranId = toUUID('usr-ct-oran');
  const ctAlgerId = toUUID('usr-ct-alger');
  const metreurId = toUUID('usr-metreur-oran');
  const approId = toUUID('usr-appro');
  const materielId = toUUID('usr-materiel');
  const comptaId = toUUID('usr-compta');

  // Groupe 1 : Cellule Béton & Contrôle CTC
  const grp1Id = 'grp_beton_ctc';
  const grp1Info = {
    id: grp1Id,
    nom: 'Cellule Béton & Contrôle CTC',
    description: 'Coordination technique des réceptions de ferraillage, coulage et écrasement des éprouvettes 28 jours.',
    createur_id: techId,
    createur_nom: 'Yacine Hamidi',
    participants_ids: [adminId1, adminId2, techId, ctOranId, ctAlgerId, metreurId],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  };

  // Groupe 2 : Comité Approvisionnements & Matériel
  const grp2Id = 'grp_achats_materiel';
  const grp2Info = {
    id: grp2Id,
    nom: 'Comité Approvisionnements & Matériel',
    description: 'Négociation groupée ciment/acier et planification de la maintenance des engins de levage.',
    createur_id: approId,
    createur_nom: 'Reda Benali',
    participants_ids: [adminId1, adminId2, approId, materielId, comptaId, ctAlgerId],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  };

  const sampleMessages = [
    // Messages Groupe 1
    {
      id: toUUID('msg-grp1-001'),
      titre: 'Groupe: Cellule Béton & Contrôle CTC',
      message: 'Groupe créé par Yacine Hamidi. Bienvenue aux conducteurs et métreurs. Les fiches d\'agrément des centrales à béton de Zahana et Alger sont validées.',
      module: 'MESSAGERIE',
      type: 'GROUPE',
      priorite: 'NORMALE',
      statut_validation: 'NON_APPLICABLE',
      expediteur_id: techId,
      expediteur_nom: 'Yacine Hamidi',
      expediteur_role: 'RESPONSABLE_TECHNIQUE',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: `groupe_${grp1Id}`,
      lu: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      historique_actions: [{ pieces_jointes: [], group_info: grp1Info }]
    },
    {
      id: toUUID('msg-grp1-002'),
      titre: 'Groupe: Cellule Béton & Contrôle CTC',
      message: 'Parfait Yacine. Le PV d\'écrasement à 28 jours sur le radier Oran a donné 32.5 MPa, ce qui est supérieur à la spécification nominale (B25).',
      module: 'MESSAGERIE',
      type: 'GROUPE',
      priorite: 'NORMALE',
      statut_validation: 'NON_APPLICABLE',
      expediteur_id: ctOranId,
      expediteur_nom: 'Tarek Saidi',
      expediteur_role: 'CONDUCTEUR_TRAVAUX',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: `groupe_${grp1Id}`,
      lu: true,
      created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      historique_actions: [{ pieces_jointes: [], group_info: grp1Info }]
    },
    // Messages Groupe 2
    {
      id: toUUID('msg-grp2-001'),
      titre: 'Groupe: Comité Approvisionnements & Matériel',
      message: 'Groupe créé par Reda Benali. Objectif : finaliser le contrat cadre pour le rond à béton 2027 avec Tosyali.',
      module: 'MESSAGERIE',
      type: 'GROUPE',
      priorite: 'NORMALE',
      statut_validation: 'NON_APPLICABLE',
      expediteur_id: approId,
      expediteur_nom: 'Reda Benali',
      expediteur_role: 'RESPONSABLE_APPROVISIONNEMENTS',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: `groupe_${grp2Id}`,
      lu: true,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      historique_actions: [{ pieces_jointes: [], group_info: grp2Info }]
    },
    {
      id: toUUID('msg-grp2-002'),
      titre: 'Groupe: Comité Approvisionnements & Matériel',
      message: 'Les conditions de paiement à 45 jours ont été validées côté trésorerie.',
      module: 'MESSAGERIE',
      type: 'GROUPE',
      priorite: 'NORMALE',
      statut_validation: 'NON_APPLICABLE',
      expediteur_id: comptaId,
      expediteur_nom: 'Samir Taleb',
      expediteur_role: 'RESPONSABLE_COMPTABILITE',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: `groupe_${grp2Id}`,
      lu: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      historique_actions: [{ pieces_jointes: [], group_info: grp2Info }]
    }
  ];

  const { error } = await sb.from('notifications').upsert(sampleMessages);
  if (error) console.error('Erreur:', error.message);
  else console.log('✅ 2 Groupes d\'équipe et leurs messages d\'exemple insérés dans Supabase !');
}

seedSampleGroups();
