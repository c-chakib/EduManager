// Script de mise à jour en masse des étudiants dans MongoDB
// Usage : node enrichEtudiants.js

import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/etudiants';

async function enrichAllEtudiants() {
  await mongoose.connect(MONGODB_URI);
  const etudiants = await Etudiant.find({});
  let updated = 0;

  for (const etu of etudiants) {
    let modif = false;
    // Pays par défaut
    if (!etu.pays) { etu.pays = 'Maroc'; modif = true; }
    // Genre par défaut
    if (!etu.genre) { etu.genre = 'M'; modif = true; }
    // Code postal par défaut
    if (!etu.codePostal) { etu.codePostal = '10000'; modif = true; }
    // Statut par défaut
    if (!etu.statut) { etu.statut = 'actif'; modif = true; }
    // Boursier par défaut
    if (etu.boursier === undefined) { etu.boursier = false; modif = true; }
    // Redoublant par défaut
    if (etu.redoublant === undefined) { etu.redoublant = false; modif = true; }
    // Nationalité par défaut
    if (!etu.nationalite) { etu.nationalite = 'Marocaine'; modif = true; }
    // Ville par défaut
    if (!etu.ville) { etu.ville = 'Casablanca'; modif = true; }
    // Adresse par défaut
    if (!etu.adresse) { etu.adresse = 'Adresse inconnue'; modif = true; }
    // Téléphone par défaut
    if (!etu.telephone) { etu.telephone = '+212 600 000 000'; modif = true; }
    // Téléphone parent par défaut
    if (!etu.telephoneParent) { etu.telephoneParent = '+212 611 111 111'; modif = true; }
    // Filière par défaut
    if (!etu.filiere) { etu.filiere = 'Informatique'; modif = true; }
    // Niveau par défaut
    if (!etu.niveau) { etu.niveau = 'Bac+1'; modif = true; }
    // Année d'inscription par défaut
    if (!etu.anneeInscription) { etu.anneeInscription = 2025; modif = true; }
    // Date de naissance par défaut (aléatoire entre 2000 et 2006)
    if (!etu.dateNaissance) {
      const year = Math.floor(Math.random() * 7) + 2000;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      etu.dateNaissance = new Date(`${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`);
      modif = true;
    }
    // Photo par défaut
    if (!etu.photo) { etu.photo = 'https://i.pravatar.cc/150?img=1'; modif = true; }
    // Matieres par défaut
    if (!etu.matieres || etu.matieres.length === 0) { etu.matieres = ['Mathématiques', 'Français']; modif = true; }
    // Notes par défaut
    if (!etu.notes || etu.notes.length === 0) {
      etu.notes = [{
        matiere: 'Mathématiques',
        note: 12,
        coefficient: 2,
        date: new Date(),
        type: 'examen'
      }];
      modif = true;
    }
    // Documents par défaut
    if (!etu.documents || etu.documents.length === 0) {
      etu.documents = [{
        nom: 'Certificat de scolarité',
        type: 'certificat',
        url: '/docs/certificat.pdf',
        dateUpload: new Date()
      }];
      modif = true;
    }
    // Remarques par défaut
    if (!etu.remarques) { etu.remarques = ''; modif = true; }
    if (modif) {
      await etu.save();
      updated++;
    }
  }
  await mongoose.disconnect();
  console.log(`Mise à jour terminée : ${updated} étudiants enrichis.`);
}

enrichAllEtudiants().catch(e => { console.error(e); process.exit(1); });
