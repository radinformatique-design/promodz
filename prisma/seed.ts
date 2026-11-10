import { PrismaClient } from '@prisma/client';
import {
  DEMO_ENTREPRISE,
  DEMO_COMPTES_BANCAIRES,
  DEMO_PARAMETRES_GENERAUX,
  DEMO_ROLES,
  DEMO_UTILISATEURS,
  DEMO_CHANTIERS,
  DEMO_FOURNISSEURS,
  DEMO_EMPLOYES,
  DEMO_NOTIFICATIONS,
  DEMO_VEHICULES,
  DEMO_BIENS_IMMOBILIERS,
} from '../data/demoData';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Démarrage du seed PostgreSQL pour BatiProm Algérie...');

  // 1. Entreprise
  console.log('1. Insertion Entreprise...');
  const entreprise = await prisma.entreprise.upsert({
    where: { rc: DEMO_ENTREPRISE.rc },
    update: {},
    create: {
      id: DEMO_ENTREPRISE.id,
      raison_sociale: DEMO_ENTREPRISE.raison_sociale,
      nom_commercial: DEMO_ENTREPRISE.nom_commercial,
      forme_juridique: DEMO_ENTREPRISE.forme_juridique,
      capital_social: DEMO_ENTREPRISE.capital_social,
      rc: DEMO_ENTREPRISE.rc,
      nif: DEMO_ENTREPRISE.nif,
      nis: DEMO_ENTREPRISE.nis,
      article_imposition: DEMO_ENTREPRISE.article_imposition,
      agrement_promoteur: DEMO_ENTREPRISE.agrement_promoteur,
      adresse_siege: DEMO_ENTREPRISE.adresse_siege,
      wilaya: DEMO_ENTREPRISE.wilaya,
      telephone: DEMO_ENTREPRISE.telephone,
      email: DEMO_ENTREPRISE.email,
    },
  });

  // 2. Paramètres Généraux
  console.log('2. Insertion Paramètres Généraux...');
  await prisma.parametresGeneraux.upsert({
    where: { id: DEMO_PARAMETRES_GENERAUX.id },
    update: {},
    create: {
      id: DEMO_PARAMETRES_GENERAUX.id,
      entreprise_id: entreprise.id,
      devise_principale: DEMO_PARAMETRES_GENERAUX.devise_principale,
      langue_defaut: DEMO_PARAMETRES_GENERAUX.langue_defaut,
      is_rtl: DEMO_PARAMETRES_GENERAUX.is_rtl,
      format_date: DEMO_PARAMETRES_GENERAUX.format_date,
      heure_limite_pointage: DEMO_PARAMETRES_GENERAUX.heure_limite_pointage,
      horaires_travail: DEMO_PARAMETRES_GENERAUX.horaires_travail as any,
    },
  });

  // 3. Rôles
  console.log('3. Insertion Rôles...');
  for (const role of DEMO_ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: {
        id: role.id,
        code: role.code,
        libelle: role.libelle,
        description: role.description,
        type_acces: (role as any).type_acces || 'CENTRAL',
      },
    });
  }

  // 4. Utilisateurs
  console.log('4. Insertion Utilisateurs...');
  for (const user of DEMO_UTILISATEURS) {
    await prisma.utilisateur.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        entreprise_id: entreprise.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        poste: user.poste,
        type: user.type,
        role_id: user.role_id,
        statut: user.statut,
        photo_url: user.photo_url,
      },
    });
  }

  // 5. Chantiers
  console.log('5. Insertion Chantiers...');
  for (const ch of DEMO_CHANTIERS) {
    await prisma.chantier.upsert({
      where: { code_chantier: ch.code_chantier },
      update: {},
      create: {
        id: ch.id,
        entreprise_id: entreprise.id,
        code_chantier: ch.code_chantier,
        nom_projet: ch.nom_projet,
        description: ch.description,
        wilaya: ch.wilaya,
        commune: ch.commune,
        adresse_site: ch.adresse_site,
        superficie_terrain_m2: ch.superficie_terrain_m2,
        surface_plancher_m2: ch.surface_plancher_m2,
        nombre_logements: ch.nombre_logements,
        nombre_locaux_commerciaux: ch.nombre_locaux_commerciaux,
        nombre_niveaux: ch.nombre_niveaux,
        permis_construire_ref: ch.permis_construire_ref,
        date_ouverture_chantier: new Date(ch.date_ouverture_chantier),
        date_livraison_prevue: new Date(ch.date_livraison_prevue),
        budget_global_prevu: ch.budget_global_prevu,
        budget_engage: ch.budget_engage,
        statut: ch.statut,
        taux_avancement_physique: ch.taux_avancement_physique,
        bureau_etudes: ch.bureau_etudes,
        organisme_ctc: ch.organisme_ctc,
      },
    });
  }

  // 6. Comptes Bancaires
  console.log('6. Insertion Comptes Bancaires...');
  for (const cb of DEMO_COMPTES_BANCAIRES) {
    await prisma.compteBancaire.upsert({
      where: { rib: cb.rib },
      update: {},
      create: {
        id: cb.id,
        entreprise_id: entreprise.id,
        nom_banque: cb.nom_banque,
        code_banque: cb.code_banque,
        agence: cb.agence,
        titulaire: cb.titulaire,
        rib: cb.rib,
        iban: cb.iban,
        swift_bic: cb.swift_bic,
        devise: cb.devise,
        actif: cb.actif,
        is_compte_principal: cb.is_compte_principal,
        type_compte: cb.type_compte,
      },
    });
  }

  // 7. Fournisseurs
  console.log('7. Insertion Fournisseurs...');
  for (const f of DEMO_FOURNISSEURS) {
    const code = (f as any).code_fournisseur || `FRN-${f.id.slice(0, 8)}`;
    await prisma.fournisseur.upsert({
      where: { code_fournisseur: code },
      update: {},
      create: {
        id: f.id,
        code_fournisseur: code,
        raison_sociale: f.nom_fournisseur,
        categorie: f.categorie,
        rc: f.rc,
        nif: f.nif,
        nis: f.nis,
        adresse: f.adresse,
        wilaya: f.wilaya,
        telephone: f.telephone,
        email: f.email,
        note_evaluation: (f as any).note_evaluation || 4,
        actif: true,
      },
    });
  }

  // 8. Employés
  console.log('8. Insertion Employés...');
  for (const emp of DEMO_EMPLOYES) {
    await prisma.employe.upsert({
      where: { matricule: emp.matricule },
      update: {},
      create: {
        id: emp.id,
        matricule: emp.matricule,
        nom: emp.nom,
        prenom: emp.prenom,
        sexe: (emp as any).sexe || 'M',
        situation_familiale: (emp as any).situation_familiale || 'CELIBATAIRE',
        nombre_enfants: (emp as any).nombre_enfants || 0,
        fonction: (emp as any).fonction || (emp as any).poste || 'Ouvrier',
        qualification: (emp as any).qualification || 'Qualifié',
        type_contrat: (emp as any).type_contrat || 'CDD',
        date_recrutement: new Date((emp as any).date_recrutement || '2024-01-01'),
        salaire_base_dzd: (emp as any).salaire_base_dzd || 45000,
        num_securite_sociale: emp.num_cnas,
        statut: (emp as any).statut || 'ACTIF',
        telephone: emp.telephone,
        adresse: emp.adresse,
      },
    });
  }

  // 9. Notifications
  console.log('9. Insertion Notifications...');
  for (const notif of DEMO_NOTIFICATIONS.slice(0, 10)) {
    if (notif.destinataire_id) {
      await prisma.notification.create({
        data: {
          id: notif.id,
          destinataire_id: notif.destinataire_id,
          titre: notif.titre,
          message: notif.message,
          type: notif.type,
          module: notif.module,
          lien: (notif as any).lien || null,
          est_lue: (notif as any).est_lue || false,
          created_at: new Date(notif.created_at),
        },
      }).catch(() => {});
    }
  }

  // 10. Matériel & Véhicules
  console.log('10. Insertion Matériel...');
  for (const veh of DEMO_VEHICULES) {
    const code = veh.num_interne || `VEH-${veh.id.slice(0, 8)}`;
    await prisma.materielEngin.upsert({
      where: { code_parc: code },
      update: {},
      create: {
        id: veh.id,
        code_parc: code,
        type_engin: veh.categorie || 'VEHICULE_LEGER',
        marque: veh.marque,
        modele: veh.modele,
        immatriculation: veh.immatriculation,
        statut_operationnel: veh.statut,
        kilometrage: veh.kilometrage || 0,
        compteur_heures: veh.heures_fonctionnement || 0,
      },
    });
  }

  // 11. Biens Immobiliers
  console.log('11. Insertion Biens Immobiliers...');
  for (const bien of DEMO_BIENS_IMMOBILIERS) {
    const code = bien.reference;
    await prisma.bienImmobilier.upsert({
      where: { code_bien: code },
      update: {},
      create: {
        id: bien.id,
        chantier_id: bien.chantier_id,
        code_bien: code,
        bloc: bien.batiment_bloc,
        etage: parseInt(bien.etage, 10) || 0,
        numero_porte: bien.num_porte,
        typologie: bien.type_bien,
        surface_utile_m2: bien.superficie_utile_m2,
        prix_unitaire_m2: bien.prix_m2_dzd,
        prix_total_dzd: bien.prix_vente_dzd,
        statut_vente: bien.statut,
      },
    });
  }

  console.log('✅ Seed PostgreSQL terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
