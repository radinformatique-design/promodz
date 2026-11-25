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

async function runSeed() {
  console.log('🚀 Début du peuplement exhaustif des données exemples BatiProm Algérie...');

  // 1. ENTREPRISE
  const entrepriseId = '513079ed-613e-0fe5-c3d9-ab57381f80ea';
  await sb.from('entreprises').upsert([{
    id: entrepriseId,
    raison_sociale: 'BatiProm Promotion Immobilière SPA',
    nom_commercial: 'BatiProm Immobilier',
    forme_juridique: 'SPA',
    capital_social: 150000000,
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
  console.log('✅ Entreprise vérifiée');

  // 2. CHANTIERS
  const chOranId = toUUID('chantier-oran-elbahia');
  const chAlgerId = toUUID('chantier-alger-jardins');
  const chConstId = toUUID('chantier-constantine-pins');

  const chantiers = [
    {
      id: chOranId,
      entreprise_id: entrepriseId,
      code_chantier: 'CHT-ORN-01',
      nom_projet: 'Résidence El Bahia',
      description: 'Programme résidentiel moderne de 120 logements haut standing avec vue sur mer et commerces intégrés.',
      wilaya: 'Oran',
      commune: 'Bir El Djir',
      adresse_site: 'Boulevard du Millénium, Face Pépinière',
      superficie_terrain_m2: 5400,
      surface_plancher_m2: 18500,
      nombre_logements: 120,
      nombre_locaux_commerciaux: 14,
      nombre_niveaux: 12,
      permis_construire_ref: 'PC-2025-ORN-0084',
      date_obtention_permis: '2025-03-15',
      date_ouverture_chantier: '2025-06-01',
      date_livraison_prevue: '2027-12-31',
      budget_global_prevu: 480000000,
      budget_engage: 185000000,
      statut: 'EN_COURS',
      tauax_avancement_physique: 38, // note: column check below
      bureau_etudes: 'BET Archimède Architecture & Ingénierie',
      organisme_ctc: 'CTC Ouest - Agence d\'Oran'
    },
    {
      id: chAlgerId,
      entreprise_id: entrepriseId,
      code_chantier: 'CHT-ALG-02',
      nom_projet: 'Les Jardins de Bab Ezzouar',
      description: 'Ensemble immobilier R+9 avec parking en sous-sol, espaces verts et galerie commerciale.',
      wilaya: 'Alger',
      commune: 'Bab Ezzouar',
      adresse_site: 'Zone d\'Affaires Bab Ezzouar, Axe Principal',
      superficie_terrain_m2: 4200,
      surface_plancher_m2: 14200,
      nombre_logements: 80,
      nombre_locaux_commerciaux: 8,
      nombre_niveaux: 9,
      permis_construire_ref: 'PC-2024-ALG-0192',
      date_obtention_permis: '2024-09-10',
      date_ouverture_chantier: '2025-01-15',
      date_livraison_prevue: '2027-06-30',
      budget_global_prevu: 620000000,
      budget_engage: 410000000,
      statut: 'EN_COURS',
      taux_avancement_physique: 65,
      bureau_etudes: 'BET Polytech Alger & Associés',
      organisme_ctc: 'CTC Centre - Délégation d\'Alger'
    },
    {
      id: chConstId,
      entreprise_id: entrepriseId,
      code_chantier: 'CHT-CST-03',
      nom_projet: 'Résidence Les Pins',
      description: 'Complexe résidentiel fermé de 64 appartements F3 et F4 avec crèche et aire de jeux privative.',
      wilaya: 'Constantine',
      commune: 'Zouaghi Slimane',
      adresse_site: 'Nouvelle Ville Ali Mendjeli, Extension Sud',
      superficie_terrain_m2: 3600,
      surface_plancher_m2: 9800,
      nombre_logements: 64,
      nombre_locaux_commerciaux: 4,
      nombre_niveaux: 8,
      permis_construire_ref: 'PC-2025-CST-0041',
      date_obtention_permis: '2025-07-20',
      date_ouverture_chantier: '2025-10-01',
      date_livraison_prevue: '2028-03-31',
      budget_global_prevu: 310000000,
      budget_engage: 52000000,
      statut: 'EN_COURS',
      taux_avancement_physique: 18,
      bureau_etudes: 'BET Numidia Consulting',
      organisme_ctc: 'CTC Est - Agence de Constantine'
    }
  ];

  // Fix typo if needed
  chantiers[0].taux_avancement_physique = 38;
  delete chantiers[0].tauax_avancement_physique;

  const { error: chErr } = await sb.from('chantiers').upsert(chantiers);
  if (chErr) console.error('Erreur Chantiers:', chErr.message);
  else console.log('✅ 3 Chantiers insérés avec succès');

  // 3. UTILISATEURS (Centrale & Chantiers)
  const roleAdminId = toUUID('role-admin');
  const roleRhId = toUUID('role-rh');
  const roleJuridiqueId = toUUID('role-juridique');
  const roleComptaId = toUUID('role-compta');
  const roleTechId = toUUID('role-tech');
  const roleMaterielId = toUUID('role-materiel');
  const roleCommercialId = toUUID('role-commercial');
  const roleApproId = toUUID('role-appro');
  const roleCtId = toUUID('role-ct');
  const roleMetreurId = toUUID('role-metreur');
  const roleMagasinierId = toUUID('role-magasinier');

  const users = [
    // Utilisateurs Siège / Centrale
    {
      id: toUUID('usr-rh'),
      entreprise_id: entrepriseId,
      nom: 'Meziani',
      prenom: 'Nadia',
      email: 'rh@batiprom-dz.com',
      telephone: '0555 12 34 56',
      poste: 'Directrice des Ressources Humaines',
      type: 'CENTRAL',
      role_id: roleRhId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-juridique'),
      entreprise_id: entrepriseId,
      nom: 'Belkacem',
      prenom: 'Mourad',
      email: 'juridique@batiprom-dz.com',
      telephone: '0550 23 45 67',
      poste: 'Responsable Juridique & Foncier',
      type: 'CENTRAL',
      role_id: roleJuridiqueId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-compta'),
      entreprise_id: entrepriseId,
      nom: 'Taleb',
      prenom: 'Samir',
      email: 'compta@batiprom-dz.com',
      telephone: '0551 34 56 78',
      poste: 'Chef Comptable & Financier',
      type: 'CENTRAL',
      role_id: roleComptaId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-technique'),
      entreprise_id: entrepriseId,
      nom: 'Hamidi',
      prenom: 'Yacine',
      email: 'technique@batiprom-dz.com',
      telephone: '0552 45 67 89',
      poste: 'Directeur Technique Central',
      type: 'CENTRAL',
      role_id: roleTechId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-materiel'),
      entreprise_id: entrepriseId,
      nom: 'Bouzid',
      prenom: 'Kamel',
      email: 'materiel@batiprom-dz.com',
      telephone: '0553 56 78 90',
      poste: 'Responsable Parc Engins & Logistique',
      type: 'CENTRAL',
      role_id: roleMaterielId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-commercial'),
      entreprise_id: entrepriseId,
      nom: 'Cherif',
      prenom: 'Amel',
      email: 'commercial@batiprom-dz.com',
      telephone: '0554 67 89 01',
      poste: 'Responsable Commerciale & Ventes VEFA',
      type: 'CENTRAL',
      role_id: roleCommercialId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },
    {
      id: toUUID('usr-appro'),
      entreprise_id: entrepriseId,
      nom: 'Benali',
      prenom: 'Reda',
      email: 'appro@batiprom-dz.com',
      telephone: '0555 78 90 12',
      poste: 'Directeur des Approvisionnements & Achats',
      type: 'CENTRAL',
      role_id: roleApproId,
      statut: 'ACTIF',
      chantiers_assignes: []
    },

    // Utilisateurs Terrain / Chantiers
    {
      id: toUUID('usr-ct-oran'),
      entreprise_id: entrepriseId,
      nom: 'Saidi',
      prenom: 'Tarek',
      email: 'ct.oran@batiprom-dz.com',
      telephone: '0560 11 22 33',
      poste: 'Conducteur Principal des Travaux (Oran)',
      type: 'CHANTIER',
      role_id: roleCtId,
      statut: 'ACTIF',
      chantiers_assignes: [chOranId]
    },
    {
      id: toUUID('usr-ct-alger'),
      entreprise_id: entrepriseId,
      nom: 'Khaldi',
      prenom: 'Sofiane',
      email: 'ct.alger@batiprom-dz.com',
      telephone: '0561 22 33 44',
      poste: 'Conducteur Principal des Travaux (Alger)',
      type: 'CHANTIER',
      role_id: roleCtId,
      statut: 'ACTIF',
      chantiers_assignes: [chAlgerId]
    },
    {
      id: toUUID('usr-metreur-oran'),
      entreprise_id: entrepriseId,
      nom: 'Brahimi',
      prenom: 'Mustapha',
      email: 'metreur.oran@batiprom-dz.com',
      telephone: '0562 33 44 55',
      poste: 'Métreur Vérificateur & Suivi Attachements',
      type: 'CHANTIER',
      role_id: roleMetreurId,
      statut: 'ACTIF',
      chantiers_assignes: [chOranId]
    },
    {
      id: toUUID('usr-magasinier-alger'),
      entreprise_id: entrepriseId,
      nom: 'Mansouri',
      prenom: 'Abdelkader',
      email: 'magasinier.alger@batiprom-dz.com',
      telephone: '0563 44 55 66',
      poste: 'Magasinier Principal Chantier Bab Ezzouar',
      type: 'CHANTIER',
      role_id: roleMagasinierId,
      statut: 'ACTIF',
      chantiers_assignes: [chAlgerId]
    }
  ];

  const { error: usrErr } = await sb.from('utilisateurs').upsert(users);
  if (usrErr) console.error('Erreur Utilisateurs:', usrErr.message);
  else console.log(`✅ ${users.length} Utilisateurs Central & Chantier créés`);

  // 4. COMPTES BANCAIRES ALGERIENS
  const comptes = [
    {
      id: toUUID('banque-bna-siege'),
      entreprise_id: entrepriseId,
      nom_banque: 'Banque Nationale d\'Algérie (BNA)',
      code_banque: '001',
      agence: 'Agence Didouche Mourad (00124)',
      titulaire: 'BatiProm Promotion Immobilière SPA',
      rib: '001 00124 0300012345 67',
      iban: 'DZ2800100124030001234567',
      swift_bic: 'BNPADZAL',
      devise: 'DZD',
      actif: true,
      is_compte_principal: true,
      type_compte: 'COURANT'
    },
    {
      id: toUUID('banque-cpa-oran'),
      entreprise_id: entrepriseId,
      nom_banque: 'Crédit Populaire d\'Algérie (CPA)',
      code_banque: '004',
      agence: 'Agence Bir El Djir Oran (00412)',
      titulaire: 'BatiProm Chantier El Bahia',
      rib: '004 00412 0400054321 89',
      iban: 'DZ2800400412040005432189',
      swift_bic: 'CPALDZAL',
      devise: 'DZD',
      actif: true,
      is_compte_principal: false,
      type_compte: 'CHANTIER',
      chantier_dedie_id: chOranId
    },
    {
      id: toUUID('banque-bea-alger'),
      entreprise_id: entrepriseId,
      nom_banque: 'Banque Extérieure d\'Algérie (BEA)',
      code_banque: '002',
      agence: 'Agence Bab Ezzouar (00208)',
      titulaire: 'BatiProm Compte Séquestre VEFA',
      rib: '002 00208 0200098765 43',
      iban: 'DZ2800200208020009876543',
      swift_bic: 'BEAADZAL',
      devise: 'DZD',
      actif: true,
      is_compte_principal: false,
      type_compte: 'SEQUESTRE_VEFA',
      chantier_dedie_id: chAlgerId
    }
  ];
  const { error: bqErr } = await sb.from('comptes_bancaires').upsert(comptes);
  if (bqErr) console.error('Erreur Banques:', bqErr.message);
  else console.log('✅ 3 Comptes bancaires créés');

  // 5. FOURNISSEURS ALGERIENS
  const fTosyali = toUUID('frn-tosyali');
  const fGica = toUUID('frn-gica');
  const fCosider = toUUID('frn-cosider');
  const fBatiMetal = toUUID('frn-batimetal');
  const fKnauf = toUUID('frn-knauf');

  const fournisseurs = [
    {
      id: fTosyali,
      entreprise_id: entrepriseId,
      code_fournisseur: 'FRN-TOS-01',
      raison_sociale: 'TOSYALI Iron Steel Algérie SPA',
      forme_juridique: 'SPA',
      registre_commerce: '31/00-0987654B12',
      nif: '001231000987654',
      nis: '001231000987654',
      adresse: 'Zone Industrielle Bethioua',
      wilaya: 'Oran',
      commune: 'Bethioua',
      telephone: '041 79 50 00',
      email: 'ventes@tosyali-algerie.com',
      contact_principal: 'Karim Ould Kablia',
      telephone_contact: '0560 88 99 00',
      famille_fourniture: 'ACIER_ARMATURES',
      statut: 'ACTIF',
      delai_paiement_jours: 30,
      mode_paiement_prefere: 'VIREMENT_BANCAIRE',
      note_evaluation: 4.8,
      nombre_commandes: 12,
      montant_total_achats_dzd: 48500000
    },
    {
      id: fGica,
      entreprise_id: entrepriseId,
      code_fournisseur: 'FRN-GIC-02',
      raison_sociale: 'Groupe Industriel des Ciments d\'Algérie (GICA)',
      forme_juridique: 'EPE/SPA',
      registre_commerce: '16/00-0112233B98',
      nif: '000116000112233',
      nis: '000116000112233',
      adresse: 'Zone Industrielle Meftah / Cimenterie Zahana',
      wilaya: 'Alger',
      commune: 'Meftah',
      telephone: '023 88 12 00',
      email: 'commercial@gica.dz',
      contact_principal: 'Ahmed Bouchareb',
      telephone_contact: '0550 44 33 22',
      famille_fourniture: 'CIMENT_BETON',
      statut: 'ACTIF',
      delai_paiement_jours: 15,
      mode_paiement_prefere: 'CHEQUE_CERTIFIE',
      note_evaluation: 4.6,
      nombre_commandes: 18,
      montant_total_achats_dzd: 32000000
    },
    {
      id: fCosider,
      entreprise_id: entrepriseId,
      code_fournisseur: 'FRN-COS-03',
      raison_sociale: 'COSIDER Carrières & Granulats Filiale',
      forme_juridique: 'SPA',
      registre_commerce: '16/00-0445566B04',
      nif: '000416000445566',
      nis: '000416000445566',
      adresse: 'Route de Dar El Beïda',
      wilaya: 'Alger',
      commune: 'Dar El Beïda',
      telephone: '023 75 40 10',
      email: 'carrieres@cosider-groupe.dz',
      contact_principal: 'Mustapha Chergui',
      telephone_contact: '0555 33 22 11',
      famille_fourniture: 'GRANULATS_AGREGATS',
      statut: 'ACTIF',
      delai_paiement_jours: 30,
      mode_paiement_prefere: 'VIREMENT_BANCAIRE',
      note_evaluation: 4.5,
      nombre_commandes: 24,
      montant_total_achats_dzd: 18200000
    },
    {
      id: fBatiMetal,
      entreprise_id: entrepriseId,
      code_fournisseur: 'FRN-BAT-04',
      raison_sociale: 'BatiMetal Menuiserie Alu & Charpentes',
      forme_juridique: 'SARL',
      registre_commerce: '31/00-0778899B16',
      nif: '000731000778899',
      nis: '000731000778899',
      adresse: 'Zone d\'Activité Es Sénia',
      wilaya: 'Oran',
      commune: 'Es Sénia',
      telephone: '041 51 20 30',
      email: 'contact@batimetal-oran.com',
      contact_principal: 'Lyes Benachenhou',
      telephone_contact: '0550 77 66 55',
      famille_fourniture: 'MENUISERIE_ALU_BOIS',
      statut: 'ACTIF',
      delai_paiement_jours: 45,
      mode_paiement_prefere: 'VIREMENT_BANCAIRE',
      note_evaluation: 4.2,
      nombre_commandes: 6,
      montant_total_achats_dzd: 14500000
    },
    {
      id: fKnauf,
      entreprise_id: entrepriseId,
      code_fournisseur: 'FRN-KNF-05',
      raison_sociale: 'Knauf Plâtres Algérie SPA',
      forme_juridique: 'SPA',
      registre_commerce: '46/00-0332211B08',
      nif: '000846000332211',
      nis: '000846000332211',
      adresse: 'Zone Industrielle Ben Badis',
      wilaya: 'Aïn Témouchent',
      commune: 'Ben Badis',
      telephone: '043 65 10 20',
      email: 'info@knauf.dz',
      contact_principal: 'Hakim Belhadj',
      telephone_contact: '0561 99 88 77',
      famille_fourniture: 'PLATRERIE_ISOLATION',
      statut: 'ACTIF',
      delai_paiement_jours: 30,
      mode_paiement_prefere: 'VIREMENT_BANCAIRE',
      note_evaluation: 4.7,
      nombre_commandes: 9,
      montant_total_achats_dzd: 9800000
    }
  ];
  const { error: frnErr } = await sb.from('fournisseurs').upsert(fournisseurs);
  if (frnErr) console.error('Erreur Fournisseurs:', frnErr.message);
  else console.log('✅ 5 Fournisseurs majeurs configurés');

  // 6. EMPLOYES TERRAIN & CHANTIER (avec CNAS, NIN, Wilaya)
  const employes = [
    {
      id: toUUID('emp-001'),
      entreprise_id: entrepriseId,
      matricule: 'EMP-2024-001',
      nom: 'Berrabah',
      prenom: 'Ali',
      date_naissance: '1982-05-14',
      lieu_naissance: 'Mascara',
      wilaya_naissance: 'Mascara',
      nationalite: 'Algérienne',
      nin: '182290123456789012',
      num_cnas: '298205140023',
      groupe_sanguin: 'O+',
      telephone: '0661 12 34 56',
      adresse: 'Cité 500 Logements Bat C',
      commune: 'Bir El Djir',
      wilaya: 'Oran',
      personne_urgence_nom: 'Fatima Berrabah (Épouse)',
      personne_urgence_tel: '0662 11 22 33',
      categorie: 'EXECUTION',
      qualification: 'Chef d\'équipe Coffrage & Ferraillage',
      type_contrat: 'CDI',
      date_embauche: '2023-01-10',
      salaire_base_dzd: 78000,
      chantier_actuel_id: chOranId,
      chantier_actuel_nom: 'Résidence El Bahia',
      statut: 'ACTIF'
    },
    {
      id: toUUID('emp-002'),
      entreprise_id: entrepriseId,
      matricule: 'EMP-2024-002',
      nom: 'Djebbar',
      prenom: 'Moussa',
      date_naissance: '1988-11-20',
      lieu_naissance: 'Tlemcen',
      wilaya_naissance: 'Tlemcen',
      nationalite: 'Algérienne',
      nin: '188130987654321098',
      num_cnas: '138811200045',
      groupe_sanguin: 'A+',
      telephone: '0663 22 33 44',
      adresse: 'Quartier Akid Lotfi',
      commune: 'Oran',
      wilaya: 'Oran',
      personne_urgence_nom: 'Khadidja Djebbar (Sœur)',
      personne_urgence_tel: '0664 55 66 77',
      categorie: 'EXECUTION',
      qualification: 'Grutier Professionnel Certifié CTC',
      type_contrat: 'CDI',
      date_embauche: '2023-03-01',
      salaire_base_dzd: 85000,
      chantier_actuel_id: chOranId,
      chantier_actuel_nom: 'Résidence El Bahia',
      statut: 'ACTIF'
    },
    {
      id: toUUID('emp-003'),
      entreprise_id: entrepriseId,
      matricule: 'EMP-2024-003',
      nom: 'Khelifi',
      prenom: 'Rachid',
      date_naissance: '1991-03-08',
      lieu_naissance: 'Blida',
      wilaya_naissance: 'Blida',
      nationalite: 'Algérienne',
      nin: '191090334455667788',
      num_cnas: '099103080067',
      groupe_sanguin: 'B+',
      telephone: '0665 33 44 55',
      adresse: 'Cité 1200 Logements',
      commune: 'Bab Ezzouar',
      wilaya: 'Alger',
      personne_urgence_nom: 'Samia Khelifi (Épouse)',
      personne_urgence_tel: '0666 77 88 99',
      categorie: 'MAITRISE',
      qualification: 'Chef de Chantier Second-Œuvre',
      type_contrat: 'CDI',
      date_embauche: '2023-06-15',
      salaire_base_dzd: 92000,
      chantier_actuel_id: chAlgerId,
      chantier_actuel_nom: 'Les Jardins de Bab Ezzouar',
      statut: 'ACTIF'
    },
    {
      id: toUUID('emp-004'),
      entreprise_id: entrepriseId,
      matricule: 'EMP-2024-004',
      nom: 'Aissani',
      prenom: 'Omar',
      date_naissance: '1995-07-25',
      lieu_naissance: 'Tizi Ouzou',
      wilaya_naissance: 'Tizi Ouzou',
      nationalite: 'Algérienne',
      nin: '195150556677889900',
      num_cnas: '159507250089',
      groupe_sanguin: 'AB+',
      telephone: '0667 44 55 66',
      adresse: 'Résidence 8 Mai 1945',
      commune: 'Bordj El Kiffan',
      wilaya: 'Alger',
      personne_urgence_nom: 'Mohamed Aissani (Père)',
      personne_urgence_tel: '0668 99 00 11',
      categorie: 'CADRE',
      qualification: 'Ingénieur Topographe & Implantation',
      type_contrat: 'CDI',
      date_embauche: '2024-01-05',
      salaire_base_dzd: 110000,
      chantier_actuel_id: chAlgerId,
      chantier_actuel_nom: 'Les Jardins de Bab Ezzouar',
      statut: 'ACTIF'
    },
    {
      id: toUUID('emp-005'),
      entreprise_id: entrepriseId,
      matricule: 'EMP-2024-005',
      nom: 'Meftah',
      prenom: 'Bilal',
      date_naissance: '1993-09-12',
      lieu_naissance: 'Skikda',
      wilaya_naissance: 'Skikda',
      nationalite: 'Algérienne',
      nin: '193210112233445566',
      num_cnas: '219309120034',
      groupe_sanguin: 'O-',
      telephone: '0669 55 66 77',
      adresse: 'Cité des Martyrs',
      commune: 'Zouaghi Slimane',
      wilaya: 'Constantine',
      personne_urgence_nom: 'Karima Meftah (Mère)',
      personne_urgence_tel: '0670 12 34 56',
      categorie: 'EXECUTION',
      qualification: 'Conducteur d\'engins lourds (Pelle & Bulldozer)',
      type_contrat: 'CDI',
      date_embauche: '2024-04-10',
      salaire_base_dzd: 82000,
      chantier_actuel_id: chConstId,
      chantier_actuel_nom: 'Résidence Les Pins',
      statut: 'ACTIF'
    }
  ];
  const { error: empErr } = await sb.from('employes').upsert(employes);
  if (empErr) console.error('Erreur Employés:', empErr.message);
  else console.log(`✅ ${employes.length} Employés chantiers insérés`);

  // 7. ARTICLES DE STOCK MAGASIN
  const articles = [
    {
      id: toUUID('art-ciment-425-orn'),
      chantier_id: chOranId,
      code_article: 'MAT-CIM-425',
      designation: 'Ciment Gris Haute Résistance CEM II 42.5 (Sacs 50kg GICA)',
      famille: 'LIANTS_ET_CIMENTS',
      unite_mesure: 'SAC_50KG',
      quantite_en_stock: 480,
      quantite_minimale_alerte: 100,
      prix_unitaire_dzd: 750,
      emplacement_magasin: 'Dépôt Principal B1 - Palettes couvertes',
      statut: 'DISPONIBLE'
    },
    {
      id: toUUID('art-fer-ha14-orn'),
      chantier_id: chOranId,
      code_article: 'MAT-FER-HA14',
      designation: 'Rond à béton Crénelé Haute Adhérence FeE500 Diam 14mm Tosyali',
      famille: 'ARMATURES_ACIER',
      unite_mesure: 'TONNE',
      quantite_en_stock: 24.5,
      quantite_minimale_alerte: 5,
      prix_unitaire_dzd: 112000,
      emplacement_magasin: 'Zone Stockage Aciers Extérieure Nord',
      statut: 'DISPONIBLE'
    },
    {
      id: toUUID('art-fer-ha12-alg'),
      chantier_id: chAlgerId,
      code_article: 'MAT-FER-HA12',
      designation: 'Rond à béton FeE500 Diam 12mm en barres de 12m',
      famille: 'ARMATURES_ACIER',
      unite_mesure: 'TONNE',
      quantite_en_stock: 18.2,
      quantite_minimale_alerte: 4,
      prix_unitaire_dzd: 114000,
      emplacement_magasin: 'Zone Ferraillage Parc Central',
      statut: 'DISPONIBLE'
    },
    {
      id: toUUID('art-brique-12-alg'),
      chantier_id: chAlgerId,
      code_article: 'MAT-BRIQ-12T',
      designation: 'Briques rouges creuses de terre cuite 12 trous (Cloisons & Murs)',
      famille: 'MACONNERIE',
      unite_mesure: 'PALETTE',
      quantite_en_stock: 65,
      quantite_minimale_alerte: 15,
      prix_unitaire_dzd: 18500,
      emplacement_magasin: 'Magasin Bâtiment A - Sous-sol',
      statut: 'DISPONIBLE'
    },
    {
      id: toUUID('art-sable-04-alg'),
      chantier_id: chAlgerId,
      code_article: 'MAT-SAB-04',
      designation: 'Sable d\'oued propre lavé 0/4 concassé pour mortiers et bétons',
      famille: 'GRANULATS',
      unite_mesure: 'M3',
      quantite_en_stock: 85,
      quantite_minimale_alerte: 20,
      prix_unitaire_dzd: 2400,
      emplacement_magasin: 'Silo Granulats Trémie Est',
      statut: 'DISPONIBLE'
    },
    {
      id: toUUID('art-gres-6060-alg'),
      chantier_id: chAlgerId,
      code_article: 'REV-CER-6060',
      designation: 'Carrelage Grès Cérame émaillé poli 60x60 premier choix brillant',
      famille: 'REVETEMENT_SOL',
      unite_mesure: 'M2',
      quantite_en_stock: 650,
      quantite_minimale_alerte: 100,
      prix_unitaire_dzd: 2800,
      emplacement_magasin: 'Magasin Central Intérieur - Alvéole 4',
      statut: 'DISPONIBLE'
    }
  ];
  const { error: artErr } = await sb.from('articles_stock').upsert(articles);
  if (artErr) console.error('Erreur Articles Stock:', artErr.message);
  else console.log(`✅ ${articles.length} Articles de stock configurés`);

  // 8. DEMANDES D'ACHAT (Approvisionnements)
  const demandesAchat = [
    {
      id: toUUID('da-001'),
      numero_da: 'DA-2026-001',
      chantier_id: chOranId,
      chantier_nom: 'Résidence El Bahia',
      demandeur_id: toUUID('usr-ct-oran'),
      demandeur_nom: 'Tarek Saidi',
      designation_produit: '50 Tonnes Rond à béton HA 16mm pour coulage amorces poteaux R+4',
      famille_article: 'ARMATURES_ACIER',
      quantite_demandee: 50,
      unite_mesure: 'TONNE',
      niveau_urgence: 'URGENT',
      justification: 'Planning critique de coulage validé avec le CTC pour la semaine prochaine.',
      date_besoin_chantier: '2026-11-25',
      estimation_budget_dzd: 5600000,
      statut: 'APPROUVEE'
    },
    {
      id: toUUID('da-002'),
      numero_da: 'DA-2026-002',
      chantier_id: chAlgerId,
      chantier_nom: 'Les Jardins de Bab Ezzouar',
      demandeur_id: toUUID('usr-ct-alger'),
      demandeur_nom: 'Sofiane Khaldi',
      designation_produit: '1200 m² Cloisons plaques de plâtre hydrofuge BA13 Knauf',
      famille_article: 'PLATRERIE_ISOLATION',
      quantite_demandee: 1200,
      unite_mesure: 'M2',
      niveau_urgence: 'NORMAL',
      justification: 'Démarrage des cloisons distributives intérieures des blocs B et C.',
      date_besoin_chantier: '2026-12-05',
      estimation_budget_dzd: 1440000,
      statut: 'EN_ATTENTE_VALIDATION'
    },
    {
      id: toUUID('da-003'),
      numero_da: 'DA-2026-003',
      chantier_id: chOranId,
      chantier_nom: 'Résidence El Bahia',
      demandeur_id: toUUID('usr-ct-oran'),
      demandeur_nom: 'Tarek Saidi',
      designation_produit: '300 Sacs Ciment CEM II 42.5 pour mortier de pose briques R+2',
      famille_article: 'LIANTS_ET_CIMENTS',
      quantite_demandee: 300,
      unite_mesure: 'SAC_50KG',
      niveau_urgence: 'NORMAL',
      justification: 'Réapprovisionnement stock tampon magasinier.',
      date_besoin_chantier: '2026-11-28',
      estimation_budget_dzd: 225000,
      statut: 'COMMANDEE'
    }
  ];
  const { error: daErr } = await sb.from('demandes_achat').upsert(demandesAchat);
  if (daErr) console.error('Erreur Demandes Achat:', daErr.message);
  else console.log(`✅ ${demandesAchat.length} Demandes d'achat créées`);

  // 9. ENGINS & VEHICULES DU PARC
  const vehicules = [
    {
      id: toUUID('veh-001'),
      entreprise_id: entrepriseId,
      immatriculation: '01234-123-31',
      marque: 'Potain (Manitowoc)',
      modele: 'Grue à Tour MC 85 B',
      type_vehicule: 'GRUE_A_TOUR',
      annee_mise_en_service: 2021,
      couleur: 'Jaune Chantier',
      numero_chassis: 'POT-MC85-9874',
      puissance_fiscale: 45,
      heures_service_actuel: 3420,
      chantier_actuel_id: chOranId,
      chantier_actuel_nom: 'Résidence El Bahia',
      conducteur_attitré: 'Moussa Djebbar',
      statut: 'EN_SERVICE',
      assurance_compagnie: 'SAA Assurances',
      assurance_numero_police: 'POL-SAA-2026-9988',
      assurance_date_fin: '2027-02-28',
      visite_technique_date_fin: '2027-01-15'
    },
    {
      id: toUUID('veh-002'),
      entreprise_id: entrepriseId,
      immatriculation: '05432-120-16',
      marque: 'Mercedes-Benz',
      modele: 'Camion Toupie Actros 3240 (9m³)',
      type_vehicule: 'CAMION_TOUPIE',
      annee_mise_en_service: 2022,
      couleur: 'Blanc / Bleu',
      numero_chassis: 'WDB9340321K987654',
      puissance_fiscale: 22,
      kilometrage_actuel: 87400,
      chantier_actuel_id: chAlgerId,
      chantier_actuel_nom: 'Les Jardins de Bab Ezzouar',
      conducteur_attitré: 'Lakhdar Belarbi',
      statut: 'EN_SERVICE',
      assurance_compagnie: 'CAAT Assurances',
      assurance_numero_police: 'POL-CAAT-2026-4433',
      assurance_date_fin: '2026-12-31',
      visite_technique_date_fin: '2026-12-15'
    },
    {
      id: toUUID('veh-003'),
      entreprise_id: entrepriseId,
      immatriculation: '09876-121-25',
      marque: 'Caterpillar',
      modele: 'Pelle Hydraulique sur chenilles CAT 320 GC',
      type_vehicule: 'PELLE_HYDRAULIQUE',
      annee_mise_en_service: 2023,
      couleur: 'Jaune Cat',
      numero_chassis: 'CAT0320GCG765432',
      puissance_fiscale: 28,
      heures_service_actuel: 1850,
      chantier_actuel_id: chConstId,
      chantier_actuel_nom: 'Résidence Les Pins',
      conducteur_attitré: 'Bilal Meftah',
      statut: 'EN_SERVICE',
      assurance_compagnie: 'CASH Assurances',
      assurance_numero_police: 'POL-CASH-2026-1122',
      assurance_date_fin: '2027-04-30',
      visite_technique_date_fin: '2027-03-31'
    },
    {
      id: toUUID('veh-004'),
      entreprise_id: entrepriseId,
      immatriculation: '11223-122-16',
      marque: 'Toyota',
      modele: 'Hilux Double Cabine 4x4 (Véhicule Liaison)',
      type_vehicule: 'UTILITAIRE_LEGER',
      annee_mise_en_service: 2023,
      couleur: 'Blanc Glacier',
      numero_chassis: 'AHTFR22G987654321',
      puissance_fiscale: 8,
      kilometrage_actuel: 46200,
      chantier_actuel_id: chAlgerId,
      chantier_actuel_nom: 'Les Jardins de Bab Ezzouar',
      conducteur_attitré: 'Sofiane Khaldi',
      statut: 'EN_SERVICE',
      assurance_compagnie: 'SAA Assurances',
      assurance_numero_police: 'POL-SAA-2026-7766',
      assurance_date_fin: '2027-05-15',
      visite_technique_date_fin: '2027-05-10'
    }
  ];
  const { error: vehErr } = await sb.from('vehicules').upsert(vehicules);
  if (vehErr) console.error('Erreur Véhicules:', vehErr.message);
  else console.log(`✅ ${vehicules.length} Engins et Véhicules configurés`);

  // 10. CONTROLES CTC (Contrôle Technique de Construction)
  const controlesCTC = [
    {
      id: toUUID('ctc-001'),
      chantier_id: chOranId,
      reference_rapport_ctc: 'CTC-ORN-PV-2026-089',
      date_visite: '2026-11-10',
      organisme_controle: 'CTC Ouest - Agence d\'Oran',
      ingenieur_controleur: 'Ing. Mohamed Hadj-Ali',
      element_verifie: 'Ferraillage et armatures des voiles périphériques et poteaux du Bloc A (Niveau R+3)',
      avis: 'FAVORABLE',
      details_reserves: 'Conforme aux plans d\'exécution BET visés CTC. Autorisation de coulage accordée sans réserve.',
      statut_levee: 'LEVEE'
    },
    {
      id: toUUID('ctc-002'),
      chantier_id: chAlgerId,
      reference_rapport_ctc: 'CTC-ALG-PV-2026-142',
      date_visite: '2026-11-12',
      organisme_controle: 'CTC Centre - Délégation d\'Alger',
      ingenieur_controleur: 'Ing. Djamila Boutaleb',
      element_verifie: 'Dalle de compression et poutres précontraintes plancher haut R+5',
      avis: 'FAVORABLE_AVEC_RESERVES',
      details_reserves: 'Vérifier la bonne vibration du béton autour des nœuds de poutres et maintenir la cure humide pendant 7 jours.',
      statut_levee: 'EN_COURS'
    }
  ];
  const { error: ctcErr } = await sb.from('controles_ctc').upsert(controlesCTC);
  if (ctcErr) console.error('Erreur CTC:', ctcErr.message);
  else console.log(`✅ ${controlesCTC.length} Contrôles CTC enregistrés`);

  // 11. RAPPORTS JOURNALIERS DE CHANTIER
  const rapports = [
    {
      id: toUUID('rap-001'),
      chantier_id: chOranId,
      date_rapport: '2026-11-16',
      type: 'JOURNALIER',
      effectif_total: 32,
      meteo: 'Ensoleillé, 22°C, vent faible',
      heures_intemperies: 0,
      materiel_sur_site: '1 Grue Potain MC85 en service, 2 bétonnières, 1 vibreur à béton, 1 compresseur',
      incidents_securite: 'Aucun incident. Port des EPI 100% conforme sur l\'ensemble du chantier.',
      corps_etat_presents: 'Équipe Gros-œuvre (18), Ferrailleurs (8), Électriciens gainage (4), Encadrement (2)',
      activites_realisees: 'Finition coffrage des voiles axe 4-8. Pose des armatures en chapeau dalle R+3. Réception contradictoire avec le métreur.',
      visa_conducteur: true,
      visa_securite: true
    },
    {
      id: toUUID('rap-002'),
      chantier_id: chAlgerId,
      date_rapport: '2026-11-16',
      type: 'JOURNALIER',
      effectif_total: 26,
      meteo: 'Nuageux, 19°C',
      heures_intemperies: 0,
      materiel_sur_site: 'Camion toupie Mercedes, monte-charge de façade, échafaudages tubulaires conformes',
      incidents_securite: 'R.A.S. Consignes de sécurité rappelées lors du quart d\'heure sécurité matinal.',
      corps_etat_presents: 'Plâtriers cloisons (10), Plombiers canalisations (8), Menuisiers (5), Encadrement (3)',
      activites_realisees: 'Pose des cloisons séparatives doubles BA13 sur le bloc A niveau 2. Pose des colonnes montantes EU/EV.',
      visa_conducteur: true,
      visa_securite: true
    }
  ];
  const { error: rapErr } = await sb.from('rapports_chantier').upsert(rapports);
  if (rapErr) console.error('Erreur Rapports:', rapErr.message);
  else console.log(`✅ ${rapports.length} Rapports de chantier créés`);

  // 12. LOTS TRAVAUX & AVANCEMENT
  const lots = [
    {
      id: toUUID('lot-001'),
      chantier_id: chOranId,
      code: 'LOT-01',
      intitule: 'Terrassement & Fondations Spéciales',
      description: 'Fouilles en pleine masse, décapage et coulage radier général nervuré',
      budget_prevu_dzd: 45000000,
      budget_realise_dzd: 44200000,
      taux_avancement: 100
    },
    {
      id: toUUID('lot-002'),
      chantier_id: chOranId,
      code: 'LOT-02',
      intitule: 'Gros-Œuvre & Superstructure (Béton Armé)',
      description: 'Poteaux, voiles en béton banché, poutres et planchers corps creux jusqu\'à R+12',
      budget_prevu_dzd: 195000000,
      budget_realise_dzd: 74100000,
      taux_avancement: 38
    },
    {
      id: toUUID('lot-003'),
      chantier_id: chAlgerId,
      code: 'LOT-01',
      intitule: 'Gros-Œuvre & Maçonnerie',
      description: 'Structure BA R+9 et murs extérieurs doubles parois avec isolation',
      budget_prevu_dzd: 280000000,
      budget_realise_dzd: 266000000,
      taux_avancement: 95
    },
    {
      id: toUUID('lot-004'),
      chantier_id: chAlgerId,
      code: 'LOT-02',
      intitule: 'Second-Œuvre & Revêtements',
      description: 'Plâtrerie, menuiserie aluminium, carrelage grès cérame, peinture et sanitaires',
      budget_prevu_dzd: 210000000,
      budget_realise_dzd: 94500000,
      taux_avancement: 45
    }
  ];
  const { error: lotErr } = await sb.from('lots_travaux').upsert(lots);
  if (lotErr) console.error('Erreur Lots Travaux:', lotErr.message);
  else console.log(`✅ ${lots.length} Lots de travaux configurés`);

  // 13. BIENS IMMOBILIERS (Logements VEFA & Commerces)
  const biens = [
    {
      id: toUUID('bien-orn-a101'),
      chantier_id: chOranId,
      reference: 'ORN-A-101',
      bloc: 'Bloc A',
      etage: 1,
      numero_porte: '01',
      type_bien: 'F3',
      surface_utile_m2: 92.5,
      prix_m2_dzd: 185000,
      prix_total_dzd: 17112500,
      statut_vente: 'RESERVE'
    },
    {
      id: toUUID('bien-orn-a102'),
      chantier_id: chOranId,
      reference: 'ORN-A-102',
      bloc: 'Bloc A',
      etage: 1,
      numero_porte: '02',
      type_bien: 'F4',
      surface_utile_m2: 124.0,
      prix_m2_dzd: 180000,
      prix_total_dzd: 22320000,
      statut_vente: 'DISPONIBLE'
    },
    {
      id: toUUID('bien-orn-b601'),
      chantier_id: chOranId,
      reference: 'ORN-B-601',
      bloc: 'Bloc B',
      etage: 6,
      numero_porte: '11',
      type_bien: 'F5',
      surface_utile_m2: 178.0,
      prix_m2_dzd: 210000,
      prix_total_dzd: 37380000,
      statut_vente: 'RESERVE'
    },
    {
      id: toUUID('bien-alg-a301'),
      chantier_id: chAlgerId,
      reference: 'ALG-A-301',
      bloc: 'Bloc A',
      etage: 3,
      numero_porte: '05',
      type_bien: 'F4',
      surface_utile_m2: 118.0,
      prix_m2_dzd: 240000,
      prix_total_dzd: 28320000,
      statut_vente: 'VENDU'
    },
    {
      id: toUUID('bien-alg-rdc01'),
      chantier_id: chAlgerId,
      reference: 'ALG-COM-01',
      bloc: 'Galerie RDC',
      etage: 0,
      numero_porte: 'B01',
      type_bien: 'COMMERCIAL',
      surface_utile_m2: 84.0,
      prix_m2_dzd: 320000,
      prix_total_dzd: 26880000,
      statut_vente: 'DISPONIBLE'
    }
  ];
  const { error: bienErr } = await sb.from('biens_immobiliers').upsert(biens);
  if (bienErr) console.error('Erreur Biens Immobiliers:', bienErr.message);
  else console.log(`✅ ${biens.length} Biens immobiliers créés`);

  // 14. CLIENTS PROSPECTS & RESERVATIONS VEFA
  const clients = [
    {
      id: toUUID('clt-001'),
      nom: 'Boudiaf',
      prenom: 'Abdelhamid',
      telephone: '0550 99 88 77',
      email: 'a.boudiaf@gmail.com',
      wilaya: 'Oran',
      budget_max_dzd: 25000000,
      type_recherche: 'F4 ou F5',
      statut: 'SOUS_COMPROMIS'
    },
    {
      id: toUUID('clt-002'),
      nom: 'Zitouni',
      prenom: 'Karim',
      telephone: '0555 44 22 11',
      email: 'karim.zitouni@outlook.fr',
      wilaya: 'Alger',
      budget_max_dzd: 30000000,
      type_recherche: 'F4 Haut Standing',
      statut: 'ACTE_SIGNE'
    },
    {
      id: toUUID('clt-003'),
      nom: 'Bensalem',
      prenom: 'Amina',
      telephone: '0770 12 45 78',
      email: 'amina.bensalem@yahoo.fr',
      wilaya: 'Oran',
      budget_max_dzd: 18000000,
      type_recherche: 'F3 Vue Dégagée',
      statut: 'SOUS_COMPROMIS'
    }
  ];
  const { error: cltErr } = await sb.from('clients_prospects').upsert(clients);
  if (cltErr) console.error('Erreur Clients:', cltErr.message);
  else console.log(`✅ ${clients.length} Clients prospects enregistrés`);

  const reservations = [
    {
      id: toUUID('res-001'),
      bien_id: toUUID('bien-orn-a101'),
      client_id: toUUID('clt-003'),
      date_reservation: '2026-10-15',
      notaire_nom: 'Maître Mansour (Notaire à Oran Akid Lotfi)',
      montant_convenu_dzd: 17112500,
      montant_verse_dzd: 3422500, // 20% premier versement VEFA
      statut: 'EN_COURS'
    },
    {
      id: toUUID('res-002'),
      bien_id: toUUID('bien-alg-a301'),
      client_id: toUUID('clt-002'),
      date_reservation: '2026-08-20',
      notaire_nom: 'Maître Boukhalfa (Notaire à Alger Centre)',
      montant_convenu_dzd: 28320000,
      montant_verse_dzd: 19824000, // 70% avancement VEFA
      statut: 'ACTE_NOTARIE'
    }
  ];
  const { error: resErr } = await sb.from('reservations_vefa').upsert(reservations);
  if (resErr) console.error('Erreur Réservations VEFA:', resErr.message);
  else console.log(`✅ ${reservations.length} Contrats VEFA créés`);

  // 15. MESSAGERIE (Canal Général, Canaux Chantiers et Directs)
  const messagesChat = [
    // Canal Général
    {
      id: toUUID('msg-gen-001'),
      titre: 'Directives Direction Technique',
      module: 'MESSAGERIE',
      type: 'GENERAL',
      message: 'Bienvenue sur la plateforme BatiProm. Rappel à tous les conducteurs de travaux : transmission obligatoire du journal de chantier avant 18h.',
      expediteur_id: toUUID('usr-technique'),
      expediteur_nom: 'Yacine Hamidi (Dir. Technique)',
      expediteur_role: 'RESPONSABLE_TECHNIQUE',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: 'general',
      lu: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    },
    {
      id: toUUID('msg-gen-002'),
      titre: 'Déclarations CNAS & Pointages',
      module: 'MESSAGERIE',
      type: 'GENERAL',
      message: 'La compagne de pointage et déclarations CNAS du mois en cours est ouverte. Merci de vérifier vos effectifs.',
      expediteur_id: toUUID('usr-rh'),
      expediteur_nom: 'Nadia Meziani (DRH)',
      expediteur_role: 'RESPONSABLE_RH',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: null,
      chantier_nom: null,
      lien_action: 'general',
      lu: true,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    },
    // Canal Chantier Oran
    {
      id: toUUID('msg-ch-orn-001'),
      titre: 'Coordination Chantier El Bahia',
      module: 'MESSAGERIE',
      type: 'CHANTIER',
      message: 'Bonjour l\'équipe. Le contrôle CTC a donné son accord favorable pour le coulage des poteaux R+3. Coulage prévu demain matin à la première heure.',
      expediteur_id: toUUID('usr-ct-oran'),
      expediteur_nom: 'Tarek Saidi (CT Oran)',
      expediteur_role: 'CONDUCTEUR_TRAVAUX',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: chOranId,
      chantier_nom: 'Résidence El Bahia',
      lien_action: `chantier_${chOranId}`,
      lu: true,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    },
    {
      id: toUUID('msg-ch-orn-002'),
      titre: 'Validation armatures FeE500',
      module: 'MESSAGERIE',
      type: 'CHANTIER',
      message: 'Noté Tarek. Les armatures FeE500 ont été vérifiées et comptabilisées sur le métré contradictoire.',
      expediteur_id: toUUID('usr-metreur-oran'),
      expediteur_nom: 'Mustapha Brahimi (Métreur)',
      expediteur_role: 'METREUR_VERIFICATEUR',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: chOranId,
      chantier_nom: 'Résidence El Bahia',
      lien_action: `chantier_${chOranId}`,
      lu: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    },
    // Canal Chantier Alger
    {
      id: toUUID('msg-ch-alg-001'),
      titre: 'Livraison BA13 Knauf',
      module: 'MESSAGERIE',
      type: 'CHANTIER',
      message: 'Réception de 1200 m² de plaques BA13 Knauf attendue au magasin cet après-midi.',
      expediteur_id: toUUID('usr-ct-alger'),
      expediteur_nom: 'Sofiane Khaldi (CT Alger)',
      expediteur_role: 'CONDUCTEUR_TRAVAUX',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: chAlgerId,
      chantier_nom: 'Les Jardins de Bab Ezzouar',
      lien_action: `chantier_${chAlgerId}`,
      lu: true,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    },
    {
      id: toUUID('msg-ch-alg-002'),
      titre: 'Confirmation Stockage',
      module: 'MESSAGERIE',
      type: 'CHANTIER',
      message: 'L\'aire de stockage sous-sol Bâtiment A est dégagée et prête pour la réception du camion.',
      expediteur_id: toUUID('usr-magasinier-alger'),
      expediteur_nom: 'Abdelkader Mansouri (Magasinier)',
      expediteur_role: 'MAGASINIER',
      destinataire_id: null,
      destinataire_nom: null,
      chantier_id: chAlgerId,
      chantier_nom: 'Les Jardins de Bab Ezzouar',
      lien_action: `chantier_${chAlgerId}`,
      lu: false,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      historique_actions: [{ pieces_jointes: [] }]
    }
  ];

  const { error: msgErr } = await sb.from('notifications').upsert(messagesChat);
  if (msgErr) console.error('Erreur Messagerie:', msgErr.message);
  else console.log(`✅ ${messagesChat.length} Messages d'exemple ajoutés dans la messagerie`);

  console.log('\n======================================================');
  console.log('🎉 PEUPLEMENT DES DONNEES EXEMPLES TERMINE AVEC SUCCES');
  console.log('Tous les modules disposent désormais de données réalistes.');
  console.log('Comptes de test (Mot de passe pour tous : password123) :');
  console.log(' - Admin central : admin@batiprom-dz.com');
  console.log(' - DRH : rh@batiprom-dz.com');
  console.log(' - Juridique : juridique@batiprom-dz.com');
  console.log(' - Comptabilité : compta@batiprom-dz.com');
  console.log(' - Technique : technique@batiprom-dz.com');
  console.log(' - Matériel : materiel@batiprom-dz.com');
  console.log(' - Commercial : commercial@batiprom-dz.com');
  console.log(' - Approvisionnements : appro@batiprom-dz.com');
  console.log(' - Conducteur Oran : ct.oran@batiprom-dz.com');
  console.log(' - Conducteur Alger : ct.alger@batiprom-dz.com');
  console.log(' - Métreur Oran : metreur.oran@batiprom-dz.com');
  console.log(' - Magasinier Alger : magasinier.alger@batiprom-dz.com');
  console.log('======================================================\n');
}

runSeed().catch(console.error);
