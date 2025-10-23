import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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

function randomGrade(min = 10, max = 20) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generateNotes(niveau) {
  const numSubjects = 6 + Math.floor(Math.random() * 4); // 6-9 subjects
  const selectedNotes = [];
  const availableMatieres = [...matieresWithCoef];
  
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

async function forceUpdateNotes() {
  try {
    console.log('🔄 Force updating all student notes...');
    
    const students = await Etudiant.find({ isDemo: { $ne: true } });
    console.log(`📊 Found ${students.length} students`);
    
    let updated = 0;
    
    for (const student of students) {
      const newNotes = generateNotes(student.niveau || 'L2');
      const newMatieres = newNotes.map(n => n.matiere);
      
      await Etudiant.updateOne(
        { _id: student._id },
        { 
          $set: { 
            notes: newNotes,
            matieres: newMatieres
          } 
        }
      );
      
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`✅ Updated ${updated}/${students.length} students...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} students with new notes!`);
    
    // Test the matières list
    const matieres = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $unwind: '$notes' },
      { $group: { _id: '$notes.matiere' } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`\n📚 Found ${matieres.length} unique matières:`);
    matieres.forEach(m => console.log(`   - ${m._id}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done!');
    process.exit(0);
  }
}

forceUpdateNotes();
