import mongoose from 'mongoose';
import Matiere from './modeles/matieres.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants');

const db = mongoose.connection;
db.once('open', async () => {
    const matieres = await Matiere.find({ actif: true }).sort({ ordre: 1 });
    console.log(`\n📚 Total Active Matières: ${matieres.length}\n`);
    matieres.forEach((m, i) => {
        console.log(`${i+1}. ${m.nom.padEnd(35)} (${m.code.padEnd(8)}) - Coef: ${m.coefficient}`);
    });
    await mongoose.connection.close();
    process.exit(0);
});
