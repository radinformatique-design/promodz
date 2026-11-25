/**
 * API Route : GET /api/bootstrap
 * Charge toutes les données initiales depuis Supabase pour hydrater l'AppContext
 * Appelée une seule fois au démarrage de l'application
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function fetchTable(table: string, orderBy?: string) {
  try {
    let query = supabaseAdmin.from(table).select('*');
    if (orderBy) query = query.order(orderBy);
    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase] Erreur table ${table}:`, error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn(`[Supabase] Exception table ${table}:`, e);
    return [];
  }
}

export async function GET() {
  try {
    // Test de connexion
    const { data: testData, error: testError } = await supabaseAdmin
      .from('entreprises')
      .select('id')
      .limit(1);

    if (testError) {
      console.warn('[Supabase] Connexion échouée:', testError.message);
      return NextResponse.json({
        source: 'error',
        message: 'Base de données non disponible: ' + testError.message,
      }, { status: 503 });
    }

    // Chargement parallèle de toutes les tables
    const [
      utilisateurs,
      roles,
      entreprises,
      chantiers,
      comptesBancaires,
      parametresGeneraux,
      employes,
      affectationsHistorique,
      congesAbsences,
      pointages,
      demandesDerogation,
      fournisseurs,
      demandesAchat,
      comparaisonsOffres,
      bonsCommande,
      bonsReception,
      facturesFournisseurs,
      articlesStock,
      mouvementsStock,
      bonsSortie,
      transfertsInterChantier,
      inventairesMagasin,
      vehicules,
      entretiens,
      piecesRemplacables,
      notifications,
      auditLogs,
      documents,
      lotsTravaux,
      structuresChantier,
      postesTravaux,
      metres,
      rapportsChantier,
      controlesCTC,
      plansBET,
      situationsTravaux,
      facturesClients,
      transactions,
      declarationsFiscales,
      cloturesComptables,
      contratsJuridiques,
      documentsFonciers,
      dossiersLitiges,
      biensImmobiliers,
      clientsProspects,
      reservationsVEFA,
    ] = await Promise.all([
      fetchTable('utilisateurs', 'nom'),
      fetchTable('roles', 'code'),
      fetchTable('entreprises', 'created_at'),
      fetchTable('chantiers', 'created_at'),
      fetchTable('comptes_bancaires', 'created_at'),
      fetchTable('parametres_generaux'),
      fetchTable('employes', 'nom'),
      fetchTable('affectations_historique', 'created_at'),
      fetchTable('conges_absences', 'created_at'),
      fetchTable('pointages', 'created_at'),
      fetchTable('demandes_derogation', 'created_at'),
      fetchTable('fournisseurs', 'raison_sociale'),
      fetchTable('demandes_achat', 'created_at'),
      fetchTable('comparaisons_offres', 'created_at'),
      fetchTable('bons_commande', 'created_at'),
      fetchTable('bons_reception', 'created_at'),
      fetchTable('factures_fournisseurs', 'created_at'),
      fetchTable('articles_stock', 'designation'),
      fetchTable('mouvements_stock', 'date_mouvement'),
      fetchTable('bons_sortie', 'created_at'),
      fetchTable('transferts_inter_chantier', 'created_at'),
      fetchTable('inventaires_magasin', 'created_at'),
      fetchTable('vehicules', 'immatriculation'),
      fetchTable('entretiens', 'date_entretien'),
      fetchTable('pieces_remplacables', 'created_at'),
      fetchTable('notifications', 'created_at'),
      fetchTable('audit_logs', 'created_at'),
      fetchTable('documents_ged', 'created_at'),
      fetchTable('lots_travaux', 'code'),
      fetchTable('structure_chantier', 'created_at'),
      fetchTable('postes_travaux', 'created_at'),
      fetchTable('metres', 'date_mesure'),
      fetchTable('rapports_chantier', 'date_rapport'),
      fetchTable('controles_ctc', 'date_visite'),
      fetchTable('plans_bet', 'date_diffusion'),
      fetchTable('situations_travaux', 'created_at'),
      fetchTable('factures_clients', 'created_at'),
      fetchTable('transactions_financieres', 'date'),
      fetchTable('declarations_fiscales', 'created_at'),
      fetchTable('clotures_comptables', 'created_at'),
      fetchTable('contrats_juridiques', 'created_at'),
      fetchTable('documents_fonciers', 'created_at'),
      fetchTable('dossiers_litiges', 'created_at'),
      fetchTable('biens_immobiliers', 'created_at'),
      fetchTable('clients_prospects', 'created_at'),
      fetchTable('reservations_vefa', 'created_at'),
    ]);

    const chantiersMap = new Map((chantiers ?? []).map((c: any) => [c.id, c.nom_projet]));

    return NextResponse.json({
      source: 'database',
      message: 'Données chargées depuis Supabase.',
      data: {
        utilisateurs: utilisateurs ?? [],
        roles: roles ?? [],
        entreprise: entreprises?.[0] ?? null,
        chantiers: chantiers ?? [],
        comptesBancaires: comptesBancaires ?? [],
        parametresGeneraux: parametresGeneraux?.[0] ?? null,
        employes: employes ?? [],
        affectationsHistorique: affectationsHistorique ?? [],
        congesAbsences: congesAbsences ?? [],
        pointages: pointages ?? [],
        demandesDerogation: demandesDerogation ?? [],
        fournisseurs: (fournisseurs ?? []).map((f: any) => ({
          ...f,
          nom_fournisseur: f.nom_fournisseur || f.raison_sociale || 'Fournisseur BTP',
          categorie: f.categorie || f.famille_fourniture || 'SECOND_OEUVRE',
          forme_juridique: f.forme_juridique || 'SARL',
          note_qualite: Number(f.note_qualite ?? f.note_evaluation ?? 4.5),
          rc: f.rc || f.registre_commerce || '31/00-1234567B16',
          nif: f.nif || '000000000000000',
          nis: f.nis || '000000000000000',
          contact_commercial: f.contact_commercial || f.contact_principal || 'Contact Commercial',
          delai_livraison_moyen_jours: Number(f.delai_livraison_moyen_jours ?? f.delai_paiement_jours ?? 15),
          conditions_paiement: f.conditions_paiement || f.mode_paiement_prefere || '30 jours fin de mois',
          rib: f.rib || '001 00601 0000000000 00',
          banque_nom: f.banque_nom || 'BNA',
          agence_banque: f.agence_banque || 'Agence Centrale',
          actif: f.statut ? f.statut === 'ACTIF' : (f.actif ?? true),
        })),
        demandesAchat: (demandesAchat ?? []).map((da: any) => ({
          ...da,
          historique_validations: da.historique_validations || [],
        })),
        comparaisonsOffres: comparaisonsOffres ?? [],
        bonsCommande: bonsCommande ?? [],
        receptionsChantier: bonsReception ?? [],
        facturesFournisseurs: facturesFournisseurs ?? [],
        articlesStock: (articlesStock ?? []).map((a: any) => ({
          ...a,
          quantite_stock: a.quantite_stock ?? a.quantite_en_stock ?? 0,
          seuil_alerte_minimum: a.seuil_alerte_minimum ?? a.quantite_minimale_alerte ?? 0,
          prix_unitaire_moyen_dzd: a.prix_unitaire_moyen_dzd ?? a.prix_unitaire_dzd ?? 0,
          chantier_nom: a.chantier_nom || chantiersMap.get(a.chantier_id) || 'Chantier',
          famille: a.famille || 'SECOND_OEUVRE',
          unite_mesure: a.unite_mesure || 'Unité',
          emplacement_magasin: a.emplacement_magasin || 'Magasin Chantier',
          code_article: a.code_article || 'ART-00',
          designation: a.designation || 'Article',
        })),
        mouvementsStock: mouvementsStock ?? [],
        bonsSortie: bonsSortie ?? [],
        transfertsInterChantier: transfertsInterChantier ?? [],
        inventairesMagasin: inventairesMagasin ?? [],
        vehicules: vehicules ?? [],
        entretiens: entretiens ?? [],
        piecesRemplacables: piecesRemplacables ?? [],
        notifications: notifications ?? [],
        auditLogs: auditLogs ?? [],
        documents: documents ?? [],
        lotsTravaux: lotsTravaux ?? [],
        structuresChantier: structuresChantier ?? [],
        postesTravaux: postesTravaux ?? [],
        metres: metres ?? [],
        rapportsChantier: rapportsChantier ?? [],
        controlesCTC: controlesCTC ?? [],
        plansBET: plansBET ?? [],
        situationsTravaux: situationsTravaux ?? [],
        facturesClients: facturesClients ?? [],
        transactions: transactions ?? [],
        declarationsFiscales: declarationsFiscales ?? [],
        cloturesComptables: cloturesComptables ?? [],
        contratsJuridiques: contratsJuridiques ?? [],
        documentsFonciers: documentsFonciers ?? [],
        dossiersLitiges: dossiersLitiges ?? [],
        biensImmobiliers: (biensImmobiliers ?? []).map((b: any) => {
          const supHab = Number(b.superficie_habitable_m2 ?? b.surface_utile_m2 ?? b.surface_habitable_m2 ?? 85);
          const prixTotal = Number(b.prix_vente_dzd ?? b.prix_total_dzd ?? 15000000);
          const prixM2 = Number(b.prix_m2_dzd ?? (supHab > 0 ? Math.round(prixTotal / supHab) : 180000));
          return {
            ...b,
            batiment_bloc: b.batiment_bloc || b.bloc || 'Bloc A',
            etage: String(b.etage ?? 'RDC'),
            num_porte: b.num_porte || b.numero_porte || '01',
            type_bien: b.type_bien || 'LOGEMENT_F3',
            orientation: b.orientation || 'SUD',
            superficie_habitable_m2: supHab,
            superficie_utile_m2: Number(b.superficie_utile_m2 ?? b.surface_utile_m2 ?? supHab),
            superficie_terrasse_m2: Number(b.superficie_terrasse_m2 ?? 0),
            prix_vente_dzd: prixTotal,
            prix_m2_dzd: prixM2,
            statut: b.statut || b.statut_vente || 'DISPONIBLE',
            chantier_nom: b.chantier_nom || chantiersMap.get(b.chantier_id) || 'Chantier',
            historique_commercial: b.historique_commercial || []
          };
        }),
        clientsProspects: (clientsProspects ?? []).map((c: any) => ({
          ...c,
          numero_fiche: c.numero_fiche || `CLI-${c.id?.slice(0, 8)}`,
          nin: c.nin || '',
          adresse: c.adresse || c.wilaya || 'Algérie',
          wilaya: c.wilaya || 'Alger',
          type: c.type || (c.statut === 'SOUS_COMPROMIS' ? 'ACQUEREUR_RESERVATAIRE' : 'PROSPECT'),
          budget_max_dzd: Number(c.budget_max_dzd ?? 0),
          typologie_recherchee: c.typologie_recherchee || c.type_recherche || 'F3 / F4',
          canal_acquisition: c.canal_acquisition || 'PASSAGE_AGENCE',
          nb_visites: Number(c.nb_visites ?? 1)
        })),
        reservationsVEFA: (reservationsVEFA ?? []).map((r: any) => {
          const prixTotal = Number(r.prix_total_convenu_dzd ?? r.montant_convenu_dzd ?? 15000000);
          const encaisse = Number(r.montant_encaisse_dzd ?? r.montant_verse_dzd ?? 0);
          const solde = Number(r.solde_restant_dzd ?? (prixTotal - encaisse));
          return {
            ...r,
            numero_contrat_vefa: r.numero_contrat_vefa || `VEFA-${r.id?.slice(0, 8)}`,
            bien_ref: r.bien_ref || 'Lot Immobilier',
            chantier_nom: r.chantier_nom || chantiersMap.get(r.chantier_id) || 'Chantier',
            client_nom: r.client_nom || 'Client Acquéreur',
            client_nin: r.client_nin || '',
            client_tel: r.client_tel || '',
            notaire_nom: r.notaire_nom || 'Étude Notariale',
            prix_total_convenu_dzd: prixTotal,
            montant_encaisse_dzd: encaisse,
            solde_restant_dzd: solde,
            statut: r.statut || 'EN_COURS_RESERVATION',
            echeancier_tranches: r.echeancier_tranches || []
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('[Bootstrap] Erreur fatale:', error);
    return NextResponse.json({
      source: 'error',
      message: `Erreur de connexion: ${error?.message}`,
    }, { status: 503 });
  }
}
