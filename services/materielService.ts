import { 
  Vehicule, 
  Entretien, 
  PieceRemplacable, 
  HistoriquePermutationPneu, 
  HistoriqueRemplacementPiece,
  AffectationMaterielChantier 
} from '../types/database';

export interface AlerteParc {
  id: string;
  vehiculeId: string;
  vehiculeNom: string;
  numInterne: string;
  immatriculation: string;
  chantierId?: string;
  chantierNom?: string;
  type: 'VIDANGE' | 'CONTROLE_TECHNIQUE' | 'ASSURANCE' | 'PNEU' | 'BATTERIE' | 'PANNE';
  titre: string;
  description: string;
  urgence: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';
  dateEcheance?: string;
  depassementValeur?: string;
}

export const materielService = {
  /**
   * Calcul des alertes intelligentes (Kilométrage, Heures de fonctionnement, Dates)
   */
  calculerAlertesParc: (
    vehicules: Vehicule[], 
    pieces: PieceRemplacable[], 
    entretiens: Entretien[]
  ): AlerteParc[] => {
    const alertes: AlerteParc[] = [];
    const maintenant = new Date();
    const dans30Jours = new Date();
    dans30Jours.setDate(maintenant.getDate() + 30);
    const dans15Jours = new Date();
    dans15Jours.setDate(maintenant.getDate() + 15);

    vehicules.forEach(v => {
      const nomVehicule = `${v.marque} ${v.modele}`;

      // 1. Alerte Panne / Réparation
      if (v.statut === 'EN_PANNE' || v.statut === 'EN_REPARATION') {
        alertes.push({
          id: `alerte-statut-${v.id}`,
          vehiculeId: v.id,
          vehiculeNom: nomVehicule,
          numInterne: v.num_interne,
          immatriculation: v.immatriculation,
          chantierId: v.chantier_id,
          type: 'PANNE',
          titre: `Véhicule immobilisé (${v.statut})`,
          description: `Ce matériel est actuellement hors service ou en atelier de réparation.`,
          urgence: 'CRITIQUE'
        });
      }

      // 2. Alerte Assurance
      if (v.date_fin_assurance) {
        const dateAssurance = new Date(v.date_fin_assurance);
        if (dateAssurance < maintenant) {
          alertes.push({
            id: `alerte-ass-exp-${v.id}`,
            vehiculeId: v.id,
            vehiculeNom: nomVehicule,
            numInterne: v.num_interne,
            immatriculation: v.immatriculation,
            chantierId: v.chantier_id,
            type: 'ASSURANCE',
            titre: `Police d'assurance EXPIRÉE`,
            description: `Assurance ${v.assurance_compagnie || ''} échue le ${v.date_fin_assurance}. Interdiction de circulation.`,
            urgence: 'CRITIQUE',
            dateEcheance: v.date_fin_assurance
          });
        } else if (dateAssurance <= dans30Jours) {
          alertes.push({
            id: `alerte-ass-prox-${v.id}`,
            vehiculeId: v.id,
            vehiculeNom: nomVehicule,
            numInterne: v.num_interne,
            immatriculation: v.immatriculation,
            chantierId: v.chantier_id,
            type: 'ASSURANCE',
            titre: `Échéance assurance proche`,
            description: `L'assurance expire le ${v.date_fin_assurance} (sous ${Math.ceil((dateAssurance.getTime() - maintenant.getTime()) / (1000 * 3600 * 24))} jours).`,
            urgence: 'AVERTISSEMENT',
            dateEcheance: v.date_fin_assurance
          });
        }
      }

      // 3. Alerte Contrôle Technique
      if (v.date_prochain_controle_technique) {
        const dateCT = new Date(v.date_prochain_controle_technique);
        if (dateCT < maintenant) {
          alertes.push({
            id: `alerte-ct-exp-${v.id}`,
            vehiculeId: v.id,
            vehiculeNom: nomVehicule,
            numInterne: v.num_interne,
            immatriculation: v.immatriculation,
            chantierId: v.chantier_id,
            type: 'CONTROLE_TECHNIQUE',
            titre: `Contrôle technique EXPIRÉ`,
            description: `Visite périodique en retard depuis le ${v.date_prochain_controle_technique}.`,
            urgence: 'CRITIQUE',
            dateEcheance: v.date_prochain_controle_technique
          });
        } else if (dateCT <= dans30Jours) {
          alertes.push({
            id: `alerte-ct-prox-${v.id}`,
            vehiculeId: v.id,
            vehiculeNom: nomVehicule,
            numInterne: v.num_interne,
            immatriculation: v.immatriculation,
            chantierId: v.chantier_id,
            type: 'CONTROLE_TECHNIQUE',
            titre: `Contrôle technique à renouveler`,
            description: `Visite obligatoire avant le ${v.date_prochain_controle_technique}.`,
            urgence: 'AVERTISSEMENT',
            dateEcheance: v.date_prochain_controle_technique
          });
        }
      }

      // 4. Alerte Vidange & Révision (par Date, Kilométrage, Heures de fonctionnement)
      let vidangeRequise = false;
      let vidangeUrgence: 'CRITIQUE' | 'AVERTISSEMENT' = 'AVERTISSEMENT';
      let motifVidange = '';

      // Test par Date
      if (v.date_prochaine_vidange) {
        const dateVid = new Date(v.date_prochaine_vidange);
        if (dateVid < maintenant) {
          vidangeRequise = true;
          vidangeUrgence = 'CRITIQUE';
          motifVidange += `Date de vidange dépassée (${v.date_prochaine_vidange}). `;
        } else if (dateVid <= dans15Jours) {
          vidangeRequise = true;
          motifVidange += `Vidange planifiée le ${v.date_prochaine_vidange}. `;
        }
      }

      // Test par Kilométrage
      if (v.km_prochaine_vidange && v.kilometrage) {
        const diffKm = v.km_prochaine_vidange - v.kilometrage;
        if (diffKm <= 0) {
          vidangeRequise = true;
          vidangeUrgence = 'CRITIQUE';
          motifVidange += `Kilométrage dépassé de ${Math.abs(diffKm)} km (Actuel: ${v.kilometrage} km / Seuil: ${v.km_prochaine_vidange} km). `;
        } else if (diffKm <= 1000) {
          vidangeRequise = true;
          motifVidange += `Vidange imminente dans ${diffKm} km. `;
        }
      }

      // Test par Heures de fonctionnement (Engins de chantier)
      if (v.heures_prochaine_vidange && v.heures_fonctionnement) {
        const diffHeures = v.heures_prochaine_vidange - v.heures_fonctionnement;
        if (diffHeures <= 0) {
          vidangeRequise = true;
          vidangeUrgence = 'CRITIQUE';
          motifVidange += `Heures machine dépassées de ${Math.abs(diffHeures)}h (Actuel: ${v.heures_fonctionnement}h / Seuil: ${v.heures_prochaine_vidange}h). `;
        } else if (diffHeures <= 50) {
          vidangeRequise = true;
          motifVidange += `Vidange requise dans ${diffHeures} heures de marche. `;
        }
      }

      if (vidangeRequise) {
        alertes.push({
          id: `alerte-vidange-${v.id}`,
          vehiculeId: v.id,
          vehiculeNom: nomVehicule,
          numInterne: v.num_interne,
          immatriculation: v.immatriculation,
          chantierId: v.chantier_id,
          type: 'VIDANGE',
          titre: vidangeUrgence === 'CRITIQUE' ? `Vidange & révision EN RETARD` : `Vidange imminente requise`,
          description: motifVidange.trim(),
          urgence: vidangeUrgence,
          dateEcheance: v.date_prochaine_vidange
        });
      }
    });

    // 5. Alertes Pièces & Pneus
    pieces.forEach(p => {
      const veh = vehicules.find(v => v.id === p.vehicule_id);
      const nomVehicule = veh ? `${veh.marque} ${veh.modele}` : 'Véhicule';

      if (p.etat === 'A_REMPLACER' || p.etat === 'HORS_SERVICE') {
        alertes.push({
          id: `alerte-piece-${p.id}`,
          vehiculeId: p.vehicule_id,
          vehiculeNom: nomVehicule,
          numInterne: veh?.num_interne || '',
          immatriculation: veh?.immatriculation || '',
          chantierId: veh?.chantier_id,
          type: p.type === 'PNEU' ? 'PNEU' : p.type === 'BATTERIE' ? 'BATTERIE' : 'PANNE',
          titre: `${p.type === 'PNEU' ? 'Pneu' : 'Composant'} à remplacer d'urgence (${p.position})`,
          description: `${p.designation} (${p.numero_serie}) : État '${p.etat}'. ${p.motif_remplacement || 'Usure critique constatée'}.`,
          urgence: 'CRITIQUE'
        });
      } else if (p.type === 'PNEU' && p.profondeur_sculpture_mm && p.profondeur_sculpture_mm <= 3) {
        alertes.push({
          id: `alerte-pneu-sculp-${p.id}`,
          vehiculeId: p.vehicule_id,
          vehiculeNom: nomVehicule,
          numInterne: veh?.num_interne || '',
          immatriculation: veh?.immatriculation || '',
          chantierId: veh?.chantier_id,
          type: 'PNEU',
          titre: `Usure avancée Pneu ${p.position} (${p.profondeur_sculpture_mm} mm)`,
          description: `Sculpture résiduelle critique de ${p.profondeur_sculpture_mm} mm sur le pneu ${p.numero_serie}. Prévoir remplacement ou permutation.`,
          urgence: 'AVERTISSEMENT'
        });
      }
    });

    return alertes.sort((a, b) => {
      const priorityOrder = { CRITIQUE: 0, AVERTISSEMENT: 1, INFO: 2 };
      return priorityOrder[a.urgence] - priorityOrder[b.urgence];
    });
  },

  /**
   * Calcul du Total Cost of Ownership (TCO) et des dépenses pour un véhicule
   */
  calculerDepensesVehicule: (vehiculeId: string, entretiens: Entretien[], vehicule?: Vehicule) => {
    const operations = entretiens.filter(e => e.vehicule_id === vehiculeId);
    const coutEntretiens = operations.reduce((sum, e) => sum + (e.cout || 0), 0);
    const coutAssurance = vehicule?.assurance_cout_dzd || 0;
    const totalTCO = coutEntretiens + coutAssurance;

    const parType: Record<string, number> = {};
    operations.forEach(e => {
      parType[e.type] = (parType[e.type] || 0) + (e.cout || 0);
    });

    return {
      totalDepenses: totalTCO,
      coutEntretiens,
      coutAssurance,
      nbOperations: operations.length,
      repartitionParType: parType
    };
  }
};
