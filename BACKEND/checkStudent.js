import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants');

const db = mongoose.connection;
db.once('open', async () => {
    const student = await Etudiant.findOne({ id: 21 });
    console.log('\n📋 Full Student Object (ID 21):');
    console.log(JSON.stringify(student, null, 2));
    
    await mongoose.connection.close();
    process.exit(0);
});
