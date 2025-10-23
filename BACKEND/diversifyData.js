import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/etudiants')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const filieres = [
  'Informatique',
  'Génie Logiciel',
  'Réseaux et Sécurité',
  'Intelligence Artificielle',
  'Data Science',
  'Cybersécurité',
  'Développement Web'
];

const genres = ['M', 'F'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function diversifyData() {
  try {
    console.log('🔄 Diversifying student data...');
    
    const students = await Etudiant.find({ isDemo: { $ne: true } });
    console.log(`📊 Found ${students.length} students`);
    
    let updated = 0;
    
    for (const student of students) {
      await Etudiant.updateOne(
        { _id: student._id },
        { 
          $set: { 
            genre: randomElement(genres),
            filiere: randomElement(filieres),
            boursier: Math.random() < 0.3
          } 
        }
      );
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`✅ Updated ${updated}/${students.length} students...`);
      }
    }
    
    console.log(`\n✅ Successfully diversified ${updated} students!`);
    
    // Show new statistics
    const stats = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          boursiers: { $sum: { $cond: ['$boursier', 1, 0] } },
          males: { $sum: { $cond: [{ $eq: ['$genre', 'M'] }, 1, 0] } },
          females: { $sum: { $cond: [{ $eq: ['$genre', 'F'] }, 1, 0] } }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const s = stats[0];
      console.log('\n📊 New Statistics:');
      console.log(`   👥 Total: ${s.total}`);
      console.log(`   👨 Males: ${s.males} (${Math.round(s.males/s.total*100)}%)`);
      console.log(`   👩 Females: ${s.females} (${Math.round(s.females/s.total*100)}%)`);
      console.log(`   💰 Boursiers: ${s.boursiers} (${Math.round(s.boursiers/s.total*100)}%)`);
    }
    
    const filiereStats = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $group: { _id: '$filiere', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🎯 Filiere Distribution:');
    filiereStats.forEach(f => console.log(`   ${f._id}: ${f.count} students`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done!');
    process.exit(0);
  }
}

diversifyData();
