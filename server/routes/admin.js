const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);
router.use(exigerAdmin);

const CONTRAT_PAR_DEFAUT = `CONTRAT DE TRAVAIL — BENNY'S

Entre Benny's, ci-après désigné "l'employeur", et l'employé signataire, ci-après désigné "l'employé", il est convenu ce qui suit :

Article 1 — Fonction
L'employé est engagé en tant que mécanicien au sein du garage Benny's, selon le grade qui lui est attribué.

Article 2 — Rémunération
L'employé perçoit une commission sur chaque réparation, custom et vente de kit qu'il réalise, selon le pourcentage associé à son grade. Une rémunération horaire s'ajoute pour le temps de service badgé.

Article 3 — Badgeuse et présence
L'employé s'engage à badger son entrée et sa sortie de service de manière honnête, en étant réellement présent et actif durant les heures déclarées.

Article 4 — Confidentialité
L'employé s'engage à ne pas divulguer les informations internes du garage (prix, contrats clients, données financières) à des tiers non autorisés.

Article 5 — Conduite
L'employé s'engage à respecter les autres membres de l'équipe et les clients, et à représenter le garage Benny's de manière professionnelle.

En signant ce contrat, l'employé reconnaît avoir lu et accepté l'ensemble des conditions ci-dessus.`;

// Réinitialisation complète du site : vide toutes les tables (y compris les employés)
// et recrée uniquement les grades par défaut + le compte admin de base.
// Reste accessible uniquement par un administrateur connecté (exigerAdmin ci-dessus).
router.post('/reset', (req, res) => {
  const { confirmation } = req.body;
  if (confirmation !== 'RESET') {
    return res.status(400).json({ erreur: 'Confirmation invalide' });
  }

  const reset = db.transaction(() => {
    db.prepare('DELETE FROM signatures_contrat').run();
    db.prepare('DELETE FROM sessions_service').run();
    db.prepare('DELETE FROM historique_paie').run();
    db.prepare('DELETE FROM depenses').run();
    db.prepare('DELETE FROM interventions').run();
    db.prepare('DELETE FROM marques_vehicules').run();
    db.prepare('DELETE FROM contrats').run();
    db.prepare('DELETE FROM catalogue').run();
    db.prepare('DELETE FROM employes').run();
    db.prepare('DELETE FROM grades').run();
    db.prepare('DELETE FROM contrat_travail').run();
    db.prepare('DELETE FROM parametres_paie').run();

    // Remise à zéro des compteurs auto-increment
    db.prepare(
      `DELETE FROM sqlite_sequence WHERE name IN (
        'signatures_contrat','sessions_service','historique_paie','depenses',
        'interventions','marques_vehicules','contrats','catalogue','employes','grades'
      )`
    ).run();

    // Grades par défaut
    const insertGrade = db.prepare('INSERT INTO grades (nom, commission_pourcentage, couleur) VALUES (?, ?, ?)');
    insertGrade.run('Apprenti', 35, '#22c55e');
    insertGrade.run('Mecano', 40, '#0ea5e9');
    insertGrade.run('Mecano confirmé', 45, '#3b82f6');
    insertGrade.run("Chef d'équipe", 55, '#a855f7');
    insertGrade.run('Assistant Patron', 65, '#ec4899');
    const gradePatron = insertGrade.run('Patron', 100, '#f59e0b');

    // Compte admin par défaut
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `INSERT INTO employes (identifiant, mot_de_passe_hash, nom_affiche, grade_id, est_admin) VALUES (?, ?, ?, ?, 1)`
    ).run('admin', hash, 'Administrateur', gradePatron.lastInsertRowid);

    // Contrat de travail par défaut
    db.prepare('INSERT INTO contrat_travail (id, contenu, version) VALUES (1, ?, 1)').run(CONTRAT_PAR_DEFAUT);

    // Paramètres de paie
    db.prepare('INSERT INTO parametres_paie (id, date_reset) VALUES (1, NULL)').run();
  });

  try {
    reset();
    res.json({ ok: true, message: 'Site réinitialisé. Reconnecte-toi avec admin / admin123.' });
  } catch (e) {
    res.status(500).json({ erreur: 'Échec de la réinitialisation : ' + e.message });
  }
});

module.exports = router;
