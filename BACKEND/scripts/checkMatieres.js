import mongoose from 'mongoose';
import { dbconnect } from '../modeles/DBconnect.js';
import Etudiant from '../modeles/etudiants.js';

async function checkMatieres() {
  try {
    await dbconnect();
    const allStudents = await Etudiant.find({});
    console.log('Total students:', allStudents.length);
    
    const stringMatieres = allStudents.filter(s => typeof s.matieres === 'string');
    const arrayMatieres = allStudents.filter(s => Array.isArray(s.matieres));
    const otherMatieres = allStudents.filter(s => !Array.isArray(s.matieres) && typeof s.matieres !== 'string');
    
    console.log('Students with string matieres:', stringMatieres.length);
    console.log('Students with array matieres:', arrayMatieres.length);
    console.log('Students with other matieres:', otherMatieres.length);
    
    if (stringMatieres.length > 0) {
      console.log('Sample string matieres:');
      stringMatieres.slice(0, 3).forEach(s => {
        console.log(`Student ${s.id}:`, s.matieres);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkMatieres();