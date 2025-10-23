// Script d'insertion de données de démonstration dans MongoDB
// Usage : node seedDemoEtudiants.js

import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/etudiants';

const demoEtudiants = [
  // 20 étudiants de démonstration générés automatiquement
  ...Array.from({length: 20}, (_, i) => {
    const id = 1 + i;
    const prenoms = ['Ahmed', 'Fatima', 'Mohammed', 'Aicha', 'Salma', 'Hamza', 'Khadija', 'Anas', 'Fatima', 'Rachid', 'Yassine', 'Nadia', 'Othmane', 'Meryem', 'Soufiane', 'Lina', 'Samir', 'Amina', 'Youssef', 'Imane'];
    const noms = ['El Amrani', 'Benjelloun', 'El Fassi', 'Slaoui', 'Tahiri', 'El Ghazali', 'Amrani', 'Ouazzani', 'El Idrissi', 'Zouiten', 'Berrada', 'El Fassi', 'El Alaoui', 'El Khatib', 'El Yousfi', 'El Amrani', 'El Mansouri', 'El Bouzidi', 'El Hachimi', 'El Baraka'];
    const villes = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Oujda', 'Meknès', 'Salé', 'Tétouan', 'Kenitra', 'Settat', 'Safi', 'El Jadida', 'Beni Mellal', 'Nador', 'Khouribga', 'Larache', 'Guelmim', 'Errachidia'];
    const filieres = ['Informatique', 'Commerce', 'Ingénierie', 'Lettres', 'Génie Logiciel', 'Médecine', 'Économie', 'Biologie', 'Mathématiques', 'Physique', 'Chimie', 'Droit', 'Gestion', 'Lettres', 'Informatique', 'Philosophie', 'Histoire', 'Géographie', 'Anglais', 'Espagnol'];
    const matieres = [
      ['Mathématiques', 'Physique'],
      ['Français', 'Anglais'],
      ['Informatique', 'Mathématiques'],
      ['Littérature', 'Histoire'],
      ['Mathématiques', 'Physique'],
      ['Biologie', 'Chimie'],
      ['Anglais', 'Français'],
      ['Histoire', 'Géographie'],
      ['Informatique', 'Mathématiques'],
      ['Philosophie', 'Lettres'],
      ['Économie', 'Gestion'],
      ['Droit', 'Gestion'],
      ['Physique', 'Chimie'],
      ['Anglais', 'Espagnol'],
      ['Mathématiques', 'Informatique'],
      ['Biologie', 'Physique'],
      ['Chimie', 'Mathématiques'],
      ['Lettres', 'Philosophie'],
      ['Gestion', 'Économie'],
      ['Géographie', 'Histoire']
    ];
    return {
      id,
      nom: noms[i],
      prenom: prenoms[i],
      mail: `${prenoms[i].toLowerCase()}.${noms[i].toLowerCase()}@example.com`,
      photo: `https://i.pravatar.cc/150?img=${10+i}`,
      matieres: matieres[i],
      dateNaissance: new Date(`200${i%6+1}-0${(i%12)+1}-1${(i%9)+1}`),
      genre: i%2===0 ? 'M' : 'F',
      telephone: `+212 6${i%10} 12 34 56 7${i%10}`,
      telephoneParent: `+212 7${i%10} 98 76 54 3${i%10}`,
      adresse: `${10+i} Rue Demo`,
      ville: villes[i],
      codePostal: `${20000 + i*1000}`,
      pays: 'Maroc',
      niveau: `Bac+${(i%4)+1}`,
      filiere: filieres[i],
      anneeInscription: 2021 + (i%4),
      statut: 'actif',
      notes: [
        { matiere: matieres[i][0], note: 10 + (i%10), coefficient: 2, date: new Date(`2024-10-${(i%28)+1}`), type: 'examen' },
        { matiere: matieres[i][1], note: 12 + (i%8), coefficient: 3, date: new Date(`2024-10-${(i%28)+2}`), type: 'controle' }
      ],
      documents: [
        { nom: 'Certificat de scolarité', type: 'autre', url: '/docs/certificat.pdf', dateUpload: new Date(`2024-09-${(i%28)+1}`) }
      ],
      boursier: i%3===0,
      remarques: i%2===0 ? 'Bon élément.' : 'Participation correcte.',
      isDemo: true,
      createdAt: new Date()
    };
  })
];

async function seedDemo() {
  await mongoose.connect(MONGODB_URI);
  // Supprime tous les étudiants de démo existants (isDemo: true) ou id de 1 à 20
  await Etudiant.deleteMany({ $or: [ { isDemo: true }, { id: { $gte: 1, $lte: 20 } } ] });
  await Etudiant.insertMany(demoEtudiants.map(e => ({...e, isDemo: true})));
  await mongoose.disconnect();
  console.log('Données de démonstration (20 étudiants) insérées dans la base MongoDB (isDemo: true).');
}

seedDemo().catch(e => { console.error(e); process.exit(1); });
