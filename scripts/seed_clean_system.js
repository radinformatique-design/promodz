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

const ROLES = [
  { id: toUUID('role-admin'), code: 'ADMINISTRATEUR', libelle: 'Administrateur Central', description: 'Accès décisionnel complet', type_acces: 'CENTRAL' },
  { id: toUUID('role-rh'), code: 'RESPONSABLE_RH', libelle: 'Responsable RH (Central)', description: 'Gestion centralisée du personnel', type_acces: 'CENTRAL' },
  { id: toUUID('role-juridique'), code: 'RESPONSABLE_JURIDIQUE', libelle: 'Responsable Juridique (Central)', description: 'Affaires foncières, permis et contentieux', type_acces: 'CENTRAL' },
  { id: toUUID('role-compta'), code: 'RESPONSABLE_COMPTABILITE', libelle: 'Responsable Comptabilité & Fiscalité (Central)', description: 'Comptabilité analytique, TVA et trésorerie', type_acces: 'CENTRAL' },
  { id: toUUID('role-tech'), code: 'RESPONSABLE_TECHNIQUE', libelle: 'Responsable Technique (Central)', description: 'Coordination technique des chantiers', type_acces: 'CENTRAL' },
  { id: toUUID('role-materiel'), code: 'RESPONSABLE_MATERIEL', libelle: 'Responsable Matériel (Central)', description: 'Parc engins, grues et logistique', type_acces: 'CENTRAL' },
  { id: toUUID('role-commercial'), code: 'RESPONSABLE_COMMERCIAL', libelle: 'Responsable Commercial (Central)', description: 'Programmes de vente sur plans (VEFA)', type_acces: 'CENTRAL' },
  { id: toUUID('role-appro'), code: 'RESPONSABLE_APPROVISIONNEMENTS', libelle: 'Responsable Approvisionnements (Central)', description: 'Centralisation des achats de matériaux', type_acces: 'CENTRAL' },
  { id: toUUID('role-ct'), code: 'CONDUCTEUR_TRAVAUX', libelle: 'Conducteur de Travaux (Chantier)', description: 'Pilotage opérationnel de chantier', type_acces: 'CHANTIER' },
  { id: toUUID('role-metreur'), code: 'METREUR_VERIFICATEUR', libelle: 'Métreur Vérificateur (Chantier)', description: 'Métrés et situations de chantier', type_acces: 'CHANTIER' },
  { id: toUUID('role-magasinier'), code: 'MAGASINIER', libelle: 'Magasinier (Chantier)', description: 'Gestion de stock de chantier', type_acces: 'CHANTIER' }
];

async function seedCleanSystem() {
  console.log('--- Initialisation Système Propre (Zéro Démo) ---');

  // 1. Entreprise Principale
  const entrepriseId = toUUID('entreprise-principale');
  const { error: entErr } = await sb.from('entreprises').upsert([{
    id: entrepriseId,
    raison_sociale: 'BatiProm Promotion Immobilière SPA',
    nom_commercial: 'BatiProm Immobilier',
    forme_juridique: 'SPA',
    capital_social: 100000000,
    rc: '16/00-1234567B20',
    nif: '002016123456789',
    nis: '002016123456789',
    article_imposition: '16123456789',
    agrement_promoteur: 'AGR-2026-ALG-042',
    adresse_siege: '12 Boulevard des Martyrs',
    wilaya: 'Alger',
    commune_siege: 'Alger-Centre',
    telephone: '023 50 00 00',
    email: 'direction@batiprom-dz.com'
  }]);
  if (entErr) console.error('Erreur Entreprise:', entErr.message);
  else console.log('✅ Entreprise configurée');

  // 2. Rôles Système
  const { error: rolesErr } = await sb.from('roles').upsert(ROLES);
  if (rolesErr) console.error('Erreur Rôles:', rolesErr.message);
  else console.log('✅ 11 Rôles RBAC configurés');

  // 3. Utilisateur Administrateur Unique Initial
  const adminId = toUUID('usr-admin-initial');
  const { error: userErr } = await sb.from('utilisateurs').upsert([{
    id: adminId,
    entreprise_id: entrepriseId,
    nom: 'Administrateur',
    prenom: 'Système',
    email: 'admin@batiprom-dz.com',
    telephone: '0550000000',
    poste: 'Administrateur Central',
    type: 'CENTRAL',
    role_id: toUUID('role-admin'),
    statut: 'ACTIF',
    chantiers_assignes: []
  }]);
  if (userErr) console.error('Erreur Utilisateur:', userErr.message);
  else console.log('✅ Utilisateur Administrateur initial créé (admin@batiprom-dz.com)');

  // 4. Paramètres Généraux
  const { error: paramErr } = await sb.from('parametres_generaux').upsert([{
    id: toUUID('param-default'),
    entreprise_id: entrepriseId,
    devise_principale: 'DZD',
    langue_defaut: 'fr',
    is_rtl: false,
    format_date: 'DD/MM/YYYY',
    heure_limite_pointage: '09:00'
  }]);
  if (paramErr) console.error('Erreur Paramètres:', paramErr.message);
  else console.log('✅ Paramètres généraux configurés');

  console.log('--- Initialisation terminée avec succès ---');
}

seedCleanSystem();
