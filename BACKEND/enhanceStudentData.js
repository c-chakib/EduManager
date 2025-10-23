import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/etudiants', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Enhanced data for better statistics
const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
const filieres = [
  'Informatique',
  'Génie Logiciel',
  'Réseaux et Sécurité',
  'Intelligence Artificielle',
  'Data Science',
  'Cybersécurité',
  'Développement Web'
];

const matieresNames = [
  'Mathématiques',
  'Algorithmique',
  'Programmation',
  'Base de Données',
  'Systèmes d\'Exploitation',
  'Réseaux',
  'Architecture des Ordinateurs',
  'Génie Logiciel',
  'Web Development',
  'Intelligence Artificielle',
  'Sécurité Informatique',
  'Anglais'
];

const matieresWithCoef = [
  { matiere: 'Mathématiques', coefficient: 3 },
  { matiere: 'Algorithmique', coefficient: 4 },
  { matiere: 'Programmation', coefficient: 5 },
  { matiere: 'Base de Données', coefficient: 4 },
  { matiere: 'Systèmes d\'Exploitation', coefficient: 3 },
  { matiere: 'Réseaux', coefficient: 3 },
  { matiere: 'Architecture des Ordinateurs', coefficient: 2 },
  { matiere: 'Génie Logiciel', coefficient: 4 },
  { matiere: 'Web Development', coefficient: 4 },
  { matiere: 'Intelligence Artificielle', coefficient: 3 },
  { matiere: 'Sécurité Informatique', coefficient: 3 },
  { matiere: 'Anglais', coefficient: 2 }
];

const genres = ['M', 'F'];

// Generate random grade between min and max
function randomGrade(min = 10, max = 20) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Generate random date of birth (ages between 18 and 30)
function randomDateOfBirth() {
  const year = 2025 - (18 + Math.floor(Math.random() * 13)); // 18 to 30 years old
  const month = Math.floor(Math.random() * 12); // 0-11
  const day = Math.floor(Math.random() * 28) + 1; // 1-28 (safe for all months)
  return new Date(year, month, day);
}

// Random element from array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate subjects with grades based on student level
function generateNotes(niveau) {
  const numSubjects = 6 + Math.floor(Math.random() * 4); // 6-9 subjects
  const selectedNotes = [];
  const availableMatieres = [...matieresWithCoef];
  
  // Performance based on level
  let baseGrade = 12;
  if (niveau === 'L1') baseGrade = 11;
  if (niveau === 'L2') baseGrade = 12;
  if (niveau === 'L3') baseGrade = 13;
  if (niveau === 'M1') baseGrade = 14;
  if (niveau === 'M2') baseGrade = 15;
  
  for (let i = 0; i < numSubjects; i++) {
    if (availableMatieres.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableMatieres.length);
    const matiereInfo = availableMatieres.splice(randomIndex, 1)[0];
    
    // Generate grade with some variance
    const variance = 3;
    const minGrade = Math.max(8, baseGrade - variance);
    const maxGrade = Math.min(20, baseGrade + variance);
    
    selectedNotes.push({
      matiere: matiereInfo.matiere,
      note: randomGrade(minGrade, maxGrade),
      coefficient: matiereInfo.coefficient,
      type: 'examen',
      date: new Date()
    });
  }
  
  return selectedNotes;
}

async function enhanceStudentData() {
  try {
    console.log('🔍 Fetching students from database...');
    
    // Get all real students (not demo)
    const students = await Etudiant.find({ isDemo: { $ne: true } });
    console.log(`📊 Found ${students.length} students to enhance`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const student of students) {
      const updates = {};
      let needsUpdate = false;
      
      // 1. Ensure dateNaissance exists and is valid
      if (!student.dateNaissance || isNaN(new Date(student.dateNaissance).getTime())) {
        updates.dateNaissance = randomDateOfBirth();
        needsUpdate = true;
      }
      
      // 2. Ensure niveau exists
      if (!student.niveau || !niveaux.includes(student.niveau)) {
        updates.niveau = randomElement(niveaux);
        needsUpdate = true;
      }
      
      // 3. Ensure filiere exists
      if (!student.filiere || !filieres.includes(student.filiere)) {
        updates.filiere = randomElement(filieres);
        needsUpdate = true;
      }
      
      // 4. Ensure genre exists
      if (!student.genre || !genres.includes(student.genre)) {
        updates.genre = randomElement(genres);
        needsUpdate = true;
      }
      
      // 5. Ensure boursier exists (30% have scholarship)
      if (student.boursier === undefined || student.boursier === null) {
        updates.boursier = Math.random() < 0.3;
        needsUpdate = true;
      }
      
      // 6. Ensure matieres list and notes exist with grades
      if (!student.notes || student.notes.length === 0) {
        const niveau = updates.niveau || student.niveau;
        const notesData = generateNotes(niveau);
        updates.notes = notesData;
        updates.matieres = notesData.map(n => n.matiere);
        needsUpdate = true;
      } else {
        // Ensure all existing notes have valid grades and update matieres list
        const validNotes = student.notes.map(n => ({
          matiere: n.matiere,
          note: n.note && n.note > 0 ? n.note : randomGrade(10, 18),
          coefficient: n.coefficient || 3,
          type: n.type || 'examen',
          date: n.date || new Date()
        }));
        
        if (JSON.stringify(validNotes) !== JSON.stringify(student.notes)) {
          updates.notes = validNotes;
          updates.matieres = validNotes.map(n => n.matiere);
          needsUpdate = true;
        } else if (!student.matieres || student.matieres.length === 0) {
          updates.matieres = student.notes.map(n => n.matiere);
          needsUpdate = true;
        }
      }
      
      // 7. Ensure ville exists
      if (!student.ville) {
        const villes = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille'];
        updates.ville = randomElement(villes);
        needsUpdate = true;
      }
      
      // 8. Ensure codePostal exists
      if (!student.codePostal) {
        updates.codePostal = `${Math.floor(10000 + Math.random() * 90000)}`;
        needsUpdate = true;
      }
      
      // 9. Ensure telephone exists
      if (!student.telephone) {
        updates.telephone = `+33${Math.floor(600000000 + Math.random() * 99999999)}`;
        needsUpdate = true;
      }
      
      // Update the student if needed
      if (needsUpdate) {
        await Etudiant.updateOne({ _id: student._id }, { $set: updates });
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount}/${students.length} students...`);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📈 Enhancement Summary:');
    console.log(`   ✅ Updated: ${updatedCount} students`);
    console.log(`   ⏭️  Skipped: ${skippedCount} students (already complete)`);
    console.log(`   📊 Total: ${students.length} students`);
    
    // Show statistics after enhancement
    console.log('\n📊 Current Database Statistics:');
    
    const stats = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          withGrades: {
            $sum: {
              $cond: [
                { $and: [
                  { $isArray: '$notes' },
                  { $gt: [{ $size: '$notes' }, 0] }
                ]},
                1,
                0
              ]
            }
          },
          withScholarship: {
            $sum: { $cond: ['$boursier', 1, 0] }
          },
          males: {
            $sum: { $cond: [{ $eq: ['$genre', 'M'] }, 1, 0] }
          },
          females: {
            $sum: { $cond: [{ $eq: ['$genre', 'F'] }, 1, 0] }
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const s = stats[0];
      console.log(`   👥 Total Students: ${s.totalStudents}`);
      console.log(`   📝 With Grades: ${s.withGrades} (${Math.round(s.withGrades/s.totalStudents*100)}%)`);
      console.log(`   💰 With Scholarship: ${s.withScholarship} (${Math.round(s.withScholarship/s.totalStudents*100)}%)`);
      console.log(`   👨 Males: ${s.males} (${Math.round(s.males/s.totalStudents*100)}%)`);
      console.log(`   👩 Females: ${s.females} (${Math.round(s.females/s.totalStudents*100)}%)`);
    }
    
    // Level distribution
    console.log('\n📚 Level Distribution:');
    const levelStats = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $group: { _id: '$niveau', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    levelStats.forEach(l => console.log(`   ${l._id}: ${l.count} students`));
    
    // Specialization distribution
    console.log('\n🎯 Filiere Distribution:');
    const specStats = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $group: { _id: '$filiere', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    specStats.forEach(s => console.log(`   ${s._id}: ${s.count} students`));
    
    console.log('\n✨ Data enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Error enhancing student data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the enhancement
enhanceStudentData();
