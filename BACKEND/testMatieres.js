import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get a sample student
    const sample = await Etudiant.findOne({ isDemo: { $ne: true } });
    
    console.log('\n📋 Sample Student Fields:');
    console.log('- matieres field:', sample.matieres);
    console.log('- notes field (first 3):', sample.notes?.slice(0, 3));
    
    // Test the aggregation
    console.log('\n🔍 Testing Aggregation:');
    const matieres = await Etudiant.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $unwind: '$notes' },
      { $group: { _id: '$notes.matiere' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, matiere: '$_id' } }
    ]);
    
    console.log('Found', matieres.length, 'unique matières:');
    console.log(matieres.map(m => m.matiere));
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
