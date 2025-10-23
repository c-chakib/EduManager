import mongoose from 'mongoose';
import { dbconnect } from '../modeles/DBconnect.js';
import Etudiant from '../modeles/etudiants.js';

// Listes de données réalistes
const prenoms = [
  'Mohamed', 'Fatima', 'Ahmed', 'Aisha', 'Ali', 'Khadija', 'Omar', 'Amina',
  'Youssef', 'Zahra', 'Hassan', 'Maryam', 'Ibrahim', 'Layla', 'Karim', 'Nour',
  'Adam', 'Sofia', 'Mehdi', 'Sara', 'Rayan', 'Lina', 'Amine', 'Yasmine',
  'Imran', 'Hiba', 'Bilal', 'Salma', 'Hamza', 'Aya', 'Tarek', 'Malak',
  'Samir', 'Ines', 'Walid', 'Rania', 'Sami', 'Dina', 'Nabil', 'Rim',
  'Rachid', 'Houda', 'Khalil', 'Samira', 'Fares', 'Siham', 'Adel', 'Leila',
  'Mahmoud', 'Karima', 'Younes', 'Nabila', 'Hakim', 'Soumia', 'Issam', 'Wafa'
];

const noms = [
  'Alami', 'Benali', 'Chakiri', 'Drissi', 'El Amrani', 'Fahmi', 'Gharbi', 'Hassani',
  'Idrissi', 'Jamal', 'Kabbaj', 'Lahlou', 'Mansouri', 'Naciri', 'Ouazzani', 'Qadiri',
  'Rahmouni', 'Salhi', 'Tazi', 'Wahabi', 'Yazidi', 'Ziani', 'Abbadi', 'Bennani',
  'Cherkaoui', 'Daoudi', 'El Fassi', 'Filali', 'Ghali', 'Hamdi', 'Iraqi', 'Jilali',
  'Kettani', 'Lamrani', 'Mahdi', 'Naji', 'Othmani', 'Qasimi', 'Rami', 'Sabri',
  'Tahiri', 'Wardi', 'Yahyaoui', 'Zoubeir', 'Amrani', 'Bakri', 'Chaoui', 'Diouri'
];

const matieres = [
  'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Informatique',
  'Français', 'Anglais', 'Espagnol', 'Arabe', 'Histoire',
  'Géographie', 'Philosophie', 'Économie', 'Comptabilité', 'Management',
  'Marketing', 'Droit', 'Sociologie', 'Psychologie', 'Arts Plastiques',
  'Éducation Physique', 'Sciences Politiques', 'Communication', 'Architecture'
];

const villes = [
  'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 'Meknès', 'Oujda',
  'Kenitra', 'Tétouan', 'Salé', 'Mohammedia', 'El Jadida', 'Béni Mellal', 'Nador',
  'Khouribga', 'Settat', 'Safi', 'Essaouira', 'Larache'
];

// Fonction pour générer un email unique
function generateEmail(prenom, nom, index) {
  const prenomClean = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nomClean = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'edu.ma'];
  const domain = domains[index % domains.length];
  return `${prenomClean}.${nomClean}${index}@${domain}`;
}

// Fonction pour obtenir une photo depuis Pravatar
function getPhotoUrl(index) {
  // Pravatar: API gratuite avec 70+ avatars
  const avatarId = (index % 70) + 1;
  return `https://i.pravatar.cc/300?img=${avatarId}`;
}

// Fonction pour sélectionner des matières aléatoires
function getRandomMatieres(min = 3, max = 8) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...matieres].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Fonction pour générer un étudiant
function generateStudent(index) {
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
  const nom = noms[Math.floor(Math.random() * noms.length)];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  
  return {
    id: index + 1,
    nom,
    prenom,
    mail: generateEmail(prenom, nom, index),
    photo: getPhotoUrl(index),
    matieres: getRandomMatieres(),
    ville, // Info supplémentaire
    dateNaissance: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    niveau: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'][Math.floor(Math.random() * 5)]
  };
}

async function seedDatabase() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await dbconnect();
    
    console.log('🗑️  Nettoyage des données existantes...');
    await Etudiant.deleteMany({});
    
    const numberOfStudents = 250;
    console.log(`📝 Génération de ${numberOfStudents} étudiants...`);
    
    const students = [];
    for (let i = 0; i < numberOfStudents; i++) {
      students.push(generateStudent(i));
    }
    
    console.log('💾 Insertion dans la base de données...');
    const result = await Etudiant.insertMany(students);
    
    console.log(`✅ ${result.length} étudiants créés avec succès!`);
    console.log('\n📊 Statistiques:');
    console.log(`   - Étudiants: ${result.length}`);
    console.log(`   - Photos: Pravatar API (https://i.pravatar.cc)`);
    console.log(`   - Matières: ${matieres.length} disponibles`);
    console.log(`   - Villes: ${villes.length} différentes`);
    
    // Afficher quelques exemples
    console.log('\n👤 Exemples d\'étudiants créés:');
    result.slice(0, 5).forEach(etudiant => {
      console.log(`   - ${etudiant.prenom} ${etudiant.nom} (${etudiant.niveau})`);
      console.log(`     📧 ${etudiant.mail}`);
      console.log(`     📚 ${etudiant.matieres.length} matières`);
      console.log(`     🏙️  ${etudiant.ville}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

// Exécution
seedDatabase();
