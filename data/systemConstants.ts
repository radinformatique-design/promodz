import {
  PermissionAction,
  ModuleCode,
  Role,
  Permission,
  RolePermission,
  ParametresGeneraux,
  Entreprise,
  Utilisateur
} from '../types/database';

// ==========================================
// 1. ACTIONS SYSTÈME (7 ACTIONS INDÉPENDANTES)
// ==========================================
export const ACTIONS_LIST: PermissionAction[] = [
  'CONSULTER',
  'AJOUTER',
  'MODIFIER',
  'SUPPRIMER',
  'VALIDER',
  'REFUSER',
  'EXPORTER'
];

// ==========================================
// 2. MODULES SYSTÈME OFFICIELS
// ==========================================
export const MODULES_LIST: {
  code: ModuleCode;
  libelle: string;
  description?: string;
  categorie: 'CHANTIER' | 'GESTION' | 'SYSTEME';
  isCentralOnly: boolean;
}[] = [
  { code: 'DASHBOARD', libelle: 'Tableau de bord', description: 'Cockpit exécutif, indicateurs clés et métriques de performance', categorie: 'SYSTEME', isCentralOnly: false },
  { code: 'GERANT', libelle: "Vue Gérant (Consultation Globale)", description: "Module spécial du Gérant de l'Entreprise pour consulter toutes les sections", categorie: 'SYSTEME', isCentralOnly: true },
  { code: 'CHANTIERS', libelle: 'Chantiers (Suivi des travaux & Gros-Œuvre)', description: 'Journal de chantier quotidien, avancement gros-œuvre et contrôles CTC', categorie: 'CHANTIER', isCentralOnly: false },
  { code: 'POINTAGE', libelle: 'Pointage & Présences (Chantiers & Siège)', description: 'Feuille de présence quotidienne, pointage terrain/siège, heures supplémentaires et retards', categorie: 'CHANTIER', isCentralOnly: false },
  { code: 'TECHNIQUE', libelle: 'Technique & Métrés', description: 'Métrés contradictoires, bordereaux BPU, situations de travaux sous-traitants et plans BET', categorie: 'CHANTIER', isCentralOnly: false },
  { code: 'MATERIEL', libelle: 'Matériel & Parc Engins', description: 'Parc véhicules/engins, carnets d’entretien, vidanges, pneumatiques et assurances', categorie: 'CHANTIER', isCentralOnly: true },
  { code: 'MAGASIN', libelle: 'Magasin & Gestion des Stocks', description: 'Bons de réception chantier, sorties outillage/matériaux, inventaires et alertes stock', categorie: 'CHANTIER', isCentralOnly: false },
  { code: 'APPROVISIONNEMENTS', libelle: 'Approvisionnements & Achats', description: 'Demandes d’achat (DA), bons de commande (BC), consultations et livraisons directes', categorie: 'GESTION', isCentralOnly: false },
  { code: 'RH', libelle: 'Ressources Humaines', description: 'Personnel ouvrier/cadres, contrats, déclarations CNAS, paie et pointage administration siège', categorie: 'GESTION', isCentralOnly: true },
  { code: 'COMMERCIAL', libelle: 'Commercial & VEFA', description: 'Réservations de logements, contrats VEFA, échéanciers d’appels de fonds et suivi acquéreurs', categorie: 'GESTION', isCentralOnly: true },
  { code: 'COMPTABILITE', libelle: 'Comptabilité & Fiscalité', description: 'Validation budgétaire des DA, situations sous-traitants (5% retenue), facturation et décaissements', categorie: 'GESTION', isCentralOnly: true },
  { code: 'JURIDIQUE', libelle: 'Affaires Juridiques', description: 'Actes de propriété foncière, permis de construire, conventions sous-traitance et contentieux', categorie: 'GESTION', isCentralOnly: true },
  { code: 'ADMINISTRATION', libelle: 'Administration & Sécurité', description: 'Gestion des utilisateurs, matrice des habilitations RBAC, sessions et logs d’audit certifiés', categorie: 'SYSTEME', isCentralOnly: true },
  { code: 'DOCUMENTS', libelle: 'Documents & GED', description: 'Archivage numérique, plans d’architecture, rapports CTC, PV de chantier et contrats scannés', categorie: 'SYSTEME', isCentralOnly: false },
  { code: 'NOTIFICATIONS', libelle: 'Notifications & Alertes', description: 'Centre d’alertes opérationnelles, notifications d’approbation et messages d’information', categorie: 'SYSTEME', isCentralOnly: false },
  { code: 'PARAMETRES', libelle: 'Paramètres Généraux', description: 'Configuration des heures limites de pointage, seuils financiers et constantes système', categorie: 'SYSTEME', isCentralOnly: true },
  { code: 'MESSAGERIE', libelle: 'Messagerie & Canaux', description: 'Communications internes, canaux de chantier et messagerie instantanée', categorie: 'SYSTEME', isCentralOnly: false }
];

// ==========================================
// 3. 11 RÔLES OFFICIELS RBAC
// ==========================================
export const ROLE_CODE_TO_UUID: Record<string, string> = {
  ADMINISTRATEUR: 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e',
  RESPONSABLE_RH: '47481389-df1b-1ae3-cebc-9213b5db25e8',
  RESPONSABLE_JURIDIQUE: 'ae2020b4-4381-879f-28c3-228a3ba1cc49',
  RESPONSABLE_COMPTABILITE: '86a07c80-912a-40cb-225a-5c36f3544552',
  RESPONSABLE_TECHNIQUE: '985e2ed0-5886-d4f7-c123-669cf03a7b62',
  RESPONSABLE_MATERIEL: 'd68d9128-6c26-32f0-9b85-b75e7490db56',
  RESPONSABLE_COMMERCIAL: '6b7e72e0-6c02-00c3-15c7-810cdb758f5d',
  RESPONSABLE_APPROVISIONNEMENTS: '4e1c39b0-5a34-d50e-d553-7b7559949d36',
  CONDUCTEUR_TRAVAUX: '6232a05d-3700-8c1a-322e-837c79b95f21',
  METREUR_VERIFICATEUR: 'ed23deee-c671-67bf-6d71-ab7f2129c34d',
  MAGASINIER: '2da437dc-9991-c1fb-90d4-03b657ed3843'
};

export const SLUG_TO_UUID: Record<string, string> = {
  'role-admin': 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e',
  'role-gerant': '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'role-rh': '47481389-df1b-1ae3-cebc-9213b5db25e8',
  'role-juridique': 'ae2020b4-4381-879f-28c3-228a3ba1cc49',
  'role-compta': '86a07c80-912a-40cb-225a-5c36f3544552',
  'role-tech': '985e2ed0-5886-d4f7-c123-669cf03a7b62',
  'role-materiel': 'd68d9128-6c26-32f0-9b85-b75e7490db56',
  'role-commercial': '6b7e72e0-6c02-00c3-15c7-810cdb758f5d',
  'role-appro': '4e1c39b0-5a34-d50e-d553-7b7559949d36',
  'role-ct': '6232a05d-3700-8c1a-322e-837c79b95f21',
  'role-metreur': 'ed23deee-c671-67bf-6d71-ab7f2129c34d',
  'role-magasinier': '2da437dc-9991-c1fb-90d4-03b657ed3843'
};

export const UUID_TO_SLUG: Record<string, string> = Object.entries(SLUG_TO_UUID).reduce(
  (acc, [slug, uuid]) => ({ ...acc, [uuid]: slug }),
  {} as Record<string, string>
);

/**
 * Renvoie tous les identifiants équivalents d'un rôle (slug et UUID)
 */
export function getAllRoleIdentifiers(roleId: string): string[] {
  if (!roleId) return [];
  const ids = new Set<string>();
  ids.add(roleId);
  const uuid = SLUG_TO_UUID[roleId];
  if (uuid) ids.add(uuid);
  const slug = UUID_TO_SLUG[roleId];
  if (slug) ids.add(slug);
  return Array.from(ids);
}

export const SYSTEM_ROLES: Role[] = [
  // A. Utilisateurs Centraux (Siège)
  {
    id: 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e',
    code: 'ADMINISTRATEUR',
    libelle: 'Administrateur Central',
    description: 'Accès décisionnel complet et visibilité globale sur l’ensemble des chantiers et modules du siège.',
    is_system: true,
    niveau_hierarchique: 1,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    code: 'GERANT_ENTREPRISE',
    libelle: "Gérant de l'Entreprise",
    description: "Privilèges complets d'administrateur avec un module spécial de consultation consolidée de toutes les sections.",
    is_system: true,
    niveau_hierarchique: 1,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '47481389-df1b-1ae3-cebc-9213b5db25e8',
    code: 'RESPONSABLE_RH',
    libelle: 'Responsable RH (Central)',
    description: 'Gestion centralisée du personnel, déclarations CNAS, contrats et pointages ouvriers chantiers.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ae2020b4-4381-879f-28c3-228a3ba1cc49',
    code: 'RESPONSABLE_JURIDIQUE',
    libelle: 'Responsable Juridique (Central)',
    description: 'Affaires foncières, permis de construire, contrats notariés et contentieux.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '86a07c80-912a-40cb-225a-5c36f3544552',
    code: 'RESPONSABLE_COMPTABILITE',
    libelle: 'Responsable Comptabilité & Fiscalité (Central)',
    description: 'Comptabilité analytique par chantier, TVA, TAP, IBS, situations de travaux et trésorerie.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '985e2ed0-5886-d4f7-c123-669cf03a7b62',
    code: 'RESPONSABLE_TECHNIQUE',
    libelle: 'Responsable Technique (Central)',
    description: 'Coordination technique des chantiers, BET, visas CTC et validation des réceptions de travaux.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'd68d9128-6c26-32f0-9b85-b75e7490db56',
    code: 'RESPONSABLE_MATERIEL',
    libelle: 'Responsable Matériel (Central)',
    description: 'Parc engins, grues, centrales à béton, maintenances et transferts inter-chantiers.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '6b7e72e0-6c02-00c3-15c7-810cdb758f5d',
    code: 'RESPONSABLE_COMMERCIAL',
    libelle: 'Responsable Commercial (Central)',
    description: 'Programmes de vente sur plans (VEFA Loi 11-04), réservations acquéreurs et versements FGCMPI.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '4e1c39b0-5a34-d50e-d553-7b7559949d36',
    code: 'RESPONSABLE_APPROVISIONNEMENTS',
    libelle: 'Responsable Approvisionnements (Central)',
    description: 'Centralisation des achats de matériaux (acier, ciment, agrégats) et validation des commandes.',
    is_system: true,
    niveau_hierarchique: 2,
    created_at: '2026-01-01T08:00:00Z'
  },
  // B. Utilisateurs Chantiers
  {
    id: '6232a05d-3700-8c1a-322e-837c79b95f21',
    code: 'CONDUCTEUR_TRAVAUX',
    libelle: 'Conducteur de Travaux (Chantier)',
    description: 'Pilotage opérationnel exclusif sur son chantier : exécution, DA matériaux, PV et avancement.',
    is_system: true,
    niveau_hierarchique: 3,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ed23deee-c671-67bf-6d71-ab7f2129c34d',
    code: 'METREUR_VERIFICATEUR',
    libelle: 'Métreur Vérificateur (Chantier)',
    description: 'Consultation et saisie des attachements et situations techniques de son chantier.',
    is_system: true,
    niveau_hierarchique: 3,
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: '2da437dc-9991-c1fb-90d4-03b657ed3843',
    code: 'MAGASINIER',
    libelle: 'Magasinier (Chantier)',
    description: 'Gestion exclusive du stock et des réceptions du magasin de son chantier.',
    is_system: true,
    niveau_hierarchique: 4,
    created_at: '2026-01-01T08:00:00Z'
  }
];

// ==========================================
// 4. GÉNÉRATION DES PERMISSIONS SYSTÈME
// ==========================================
export const SYSTEM_PERMISSIONS: Permission[] = [];
MODULES_LIST.forEach(m => {
  ACTIONS_LIST.forEach(a => {
    SYSTEM_PERMISSIONS.push({
      id: `perm-${m.code.toLowerCase()}-${a.toLowerCase()}`,
      module: m.code,
      action: a,
      code: `${m.code}:${a}`,
      description: `${a} dans le module ${m.libelle}`
    });
  });
});

// ==========================================
// 5. MATRICE INITIALE DES RÔLES & PERMISSIONS
// ==========================================
const BASE_SYSTEM_ROLE_PERMISSIONS: RolePermission[] = [
  // 1. ADMINISTRATEUR : Tous les droits
  ...SYSTEM_PERMISSIONS.map(p => ({ role_id: 'role-admin', permission_id: p.id })),

  // 2. RESPONSABLE RH
  { role_id: 'role-rh', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-rh', permission_id: 'perm-rh-consulter' },
  { role_id: 'role-rh', permission_id: 'perm-rh-ajouter' },
  { role_id: 'role-rh', permission_id: 'perm-rh-modifier' },
  { role_id: 'role-rh', permission_id: 'perm-rh-supprimer' },
  { role_id: 'role-rh', permission_id: 'perm-rh-valider' },
  { role_id: 'role-rh', permission_id: 'perm-rh-exporter' },
  { role_id: 'role-rh', permission_id: 'perm-pointage-consulter' },
  { role_id: 'role-rh', permission_id: 'perm-pointage-ajouter' },
  { role_id: 'role-rh', permission_id: 'perm-pointage-modifier' },
  { role_id: 'role-rh', permission_id: 'perm-pointage-valider' },
  { role_id: 'role-rh', permission_id: 'perm-pointage-exporter' },
  { role_id: 'role-rh', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-rh', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-rh', permission_id: 'perm-notifications-consulter' },

  // 3. RESPONSABLE JURIDIQUE
  { role_id: 'role-juridique', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-consulter' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-ajouter' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-modifier' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-supprimer' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-valider' },
  { role_id: 'role-juridique', permission_id: 'perm-juridique-exporter' },
  { role_id: 'role-juridique', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-juridique', permission_id: 'perm-documents-ajouter' },
  { role_id: 'role-juridique', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-juridique', permission_id: 'perm-notifications-consulter' },

  // 4. RESPONSABLE COMPTABILITÉ
  { role_id: 'role-compta', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-ajouter' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-modifier' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-supprimer' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-valider' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-refuser' },
  { role_id: 'role-compta', permission_id: 'perm-comptabilite-exporter' },
  { role_id: 'role-compta', permission_id: 'perm-approvisionnements-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-approvisionnements-valider' },
  { role_id: 'role-compta', permission_id: 'perm-pointage-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-pointage-exporter' },
  { role_id: 'role-compta', permission_id: 'perm-technique-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-compta', permission_id: 'perm-notifications-consulter' },

  // 5. RESPONSABLE TECHNIQUE
  { role_id: 'role-tech', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-tech', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-tech', permission_id: 'perm-chantiers-modifier' },
  { role_id: 'role-tech', permission_id: 'perm-technique-consulter' },
  { role_id: 'role-tech', permission_id: 'perm-technique-ajouter' },
  { role_id: 'role-tech', permission_id: 'perm-technique-modifier' },
  { role_id: 'role-tech', permission_id: 'perm-technique-valider' },
  { role_id: 'role-tech', permission_id: 'perm-technique-exporter' },
  { role_id: 'role-tech', permission_id: 'perm-pointage-consulter' },
  { role_id: 'role-tech', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-tech', permission_id: 'perm-documents-ajouter' },
  { role_id: 'role-tech', permission_id: 'perm-notifications-consulter' },

  // 6. RESPONSABLE MATÉRIEL
  { role_id: 'role-materiel', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-consulter' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-ajouter' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-modifier' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-supprimer' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-valider' },
  { role_id: 'role-materiel', permission_id: 'perm-materiel-exporter' },
  { role_id: 'role-materiel', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-materiel', permission_id: 'perm-notifications-consulter' },

  // 7. RESPONSABLE COMMERCIAL
  { role_id: 'role-commercial', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-consulter' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-ajouter' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-modifier' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-supprimer' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-valider' },
  { role_id: 'role-commercial', permission_id: 'perm-commercial-exporter' },
  { role_id: 'role-commercial', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-commercial', permission_id: 'perm-notifications-consulter' },

  // 8. RESPONSABLE APPROVISIONNEMENTS
  { role_id: 'role-appro', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-appro', permission_id: 'perm-approvisionnements-consulter' },
  { role_id: 'role-appro', permission_id: 'perm-approvisionnements-ajouter' },
  { role_id: 'role-appro', permission_id: 'perm-approvisionnements-modifier' },
  { role_id: 'role-appro', permission_id: 'perm-approvisionnements-valider' },
  { role_id: 'role-appro', permission_id: 'perm-approvisionnements-exporter' },
  { role_id: 'role-appro', permission_id: 'perm-magasin-consulter' },
  { role_id: 'role-appro', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-appro', permission_id: 'perm-notifications-consulter' },

  // 9. CONDUCTEUR DE TRAVAUX (Chantier)
  { role_id: 'role-ct', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-chantiers-ajouter' },
  { role_id: 'role-ct', permission_id: 'perm-chantiers-modifier' },
  { role_id: 'role-ct', permission_id: 'perm-pointage-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-pointage-ajouter' },
  { role_id: 'role-ct', permission_id: 'perm-pointage-modifier' },
  { role_id: 'role-ct', permission_id: 'perm-pointage-valider' },
  { role_id: 'role-ct', permission_id: 'perm-pointage-exporter' },
  { role_id: 'role-ct', permission_id: 'perm-technique-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-approvisionnements-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-approvisionnements-ajouter' },
  { role_id: 'role-ct', permission_id: 'perm-magasin-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-ct', permission_id: 'perm-documents-ajouter' },
  { role_id: 'role-ct', permission_id: 'perm-notifications-consulter' },

  // 10. MÉTREUR VÉRIFICATEUR (Chantier)
  { role_id: 'role-metreur', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-metreur', permission_id: 'perm-technique-consulter' },
  { role_id: 'role-metreur', permission_id: 'perm-technique-ajouter' },
  { role_id: 'role-metreur', permission_id: 'perm-technique-modifier' },
  { role_id: 'role-metreur', permission_id: 'perm-chantiers-consulter' },
  { role_id: 'role-metreur', permission_id: 'perm-documents-consulter' },
  { role_id: 'role-metreur', permission_id: 'perm-notifications-consulter' },

  // 11. MAGASINIER (Chantier)
  { role_id: 'role-magasinier', permission_id: 'perm-dashboard-consulter' },
  { role_id: 'role-magasinier', permission_id: 'perm-magasin-consulter' },
  { role_id: 'role-magasinier', permission_id: 'perm-magasin-ajouter' },
  { role_id: 'role-magasinier', permission_id: 'perm-magasin-modifier' },
  { role_id: 'role-magasinier', permission_id: 'perm-approvisionnements-consulter' },
  { role_id: 'role-magasinier', permission_id: 'perm-notifications-consulter' },

  // 12. MESSAGERIE (Accessible à tous les collaborateurs opérationnels et centraux)
  ...['role-rh', 'role-juridique', 'role-compta', 'role-tech', 'role-materiel', 'role-commercial', 'role-appro', 'role-ct', 'role-metreur', 'role-magasinier'].flatMap(roleId => [
    { role_id: roleId, permission_id: 'perm-messagerie-consulter' },
    { role_id: roleId, permission_id: 'perm-messagerie-ajouter' }
  ])
];

export const SYSTEM_ROLE_PERMISSIONS: RolePermission[] = [
  ...BASE_SYSTEM_ROLE_PERMISSIONS,
  ...BASE_SYSTEM_ROLE_PERMISSIONS.map(rp => ({
    role_id: SLUG_TO_UUID[rp.role_id] || rp.role_id,
    permission_id: rp.permission_id
  }))
];

// ==========================================
// 6. VALEURS SYSTÈME PAR DÉFAUT (NON-DÉMO)
// ==========================================
export const DEFAULT_PARAMETRES_GENERAUX: ParametresGeneraux = {
  id: 'param-default',
  entreprise_id: 'ent-default',
  devise_principale: 'DZD',
  langue_defaut: 'fr',
  is_rtl: false,
  format_date: 'JJ/MM/AAAA',
  horaires_travail: {
    debut: '08:00',
    fin: '16:30',
    pause_dejeuner_debut: '12:00',
    pause_dejeuner_fin: '13:00',
    jours_ouvres: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi']
  },
  heure_limite_pointage: '08:30',
  notifications_config: {
    email_actif: true,
    sms_actif: false,
    alerte_depassement_budget_pct: 85,
    rappel_delai_jours_ctc: 15,
    alerte_stock_critique: true,
    alerte_retard_livraison: true,
    notifier_direction_generale: true
  },
  unites_mesure: [
    { id: 'u-m3', code: 'M3', libelle: 'Mètre cube', symbole: 'm³', categorie: 'VOLUME' },
    { id: 'u-m2', code: 'M2', libelle: 'Mètre carré', symbole: 'm²', categorie: 'SURFACE' },
    { id: 'u-ml', code: 'ML', libelle: 'Mètre linéaire', symbole: 'ml', categorie: 'LONGUEUR' },
    { id: 'u-kg', code: 'KG', libelle: 'Kilogramme', symbole: 'kg', categorie: 'POIDS' },
    { id: 'u-ton', code: 'TON', libelle: 'Tonne', symbole: 't', categorie: 'POIDS' },
    { id: 'u-u', code: 'U', libelle: 'Unité', symbole: 'u', categorie: 'UNITE' }
  ],
  exercices_comptables: [
    { id: 'ex-2026', annee: 2026, statut: 'OUVERT', date_debut: '2026-01-01', date_fin: '2026-12-31' }
  ],
  updated_at: '2026-01-01T00:00:00Z'
};

export const DEFAULT_ENTREPRISE: Entreprise = {
  id: 'ent-default',
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
  email: 'direction@batiprom-dz.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z'
};

export const INITIAL_ADMIN_USER: Utilisateur = {
  id: '49c62aaa-f619-dfd0-b4d1-1178db7cb5da',
  entreprise_id: '513079ed-613e-0fe5-c3d9-ab57381f80ea',
  nom: 'Administrateur',
  prenom: 'Système',
  email: 'admin@batiprom-dz.com',
  telephone: '0550000000',
  poste: 'Administrateur Central',
  role_id: 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e',
  type: 'CENTRAL',
  chantiers_assignes: [],
  statut: 'ACTIF',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z'
};

export const INITIAL_GERANT_USER: Utilisateur = {
  id: '8a1f3c2d-9b40-4e11-8f2a-3c5d7e9a1b02',
  entreprise_id: '513079ed-613e-0fe5-c3d9-ab57381f80ea',
  nom: 'Gérant',
  prenom: 'Direction',
  email: 'gerant@batiprom-dz.com',
  telephone: '0550000001',
  poste: "Gérant de l'Entreprise",
  role_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  type: 'CENTRAL',
  chantiers_assignes: [],
  statut: 'ACTIF',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z'
};
