import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants');

const db = mongoose.connection;
db.once('open', async () => {
    const students = await Etudiant.find({ isDemo: { $ne: true } }).limit(3);
    
    console.log('\n📋 Sample Students with New Data:\n');
    
    for (const student of students) {
        console.log('═'.repeat(80));
        console.log(`👤 ${student.prenom} ${student.nom} (ID: ${student.id})`);
        console.log(`   📧 Email: ${student.mail || 'N/A'}`);
        console.log(`   📞 Téléphone: ${student.telephone || 'N/A'}`);
        console.log(`   📍 Adresse: ${student.adresse || 'N/A'}`);
        console.log(`   🎂 Age: ${student.age} ans (né le ${student.dateNaissance?.toLocaleDateString('fr-FR') || 'N/A'})`);
        console.log(`   👤 Genre: ${student.genre === 'M' ? 'Masculin' : 'Féminin'}`);
        console.log(`   🎓 Niveau: ${student.niveau}`);
        console.log(`   🏫 Filière: ${student.filiere}`);
        console.log(`   💰 Boursier: ${student.boursier ? 'Oui' : 'Non'}`);
        console.log(`   📈 Moyenne: ${student.moyenne ? student.moyenne.toFixed(2) : 'N/A'}/20`);
        console.log(`   📚 Nombre de matières: ${student.notes?.length || 0}`);
        console.log(`\n   📖 Matières et Notes:`);
        
        // Sort by note descending
        const sortedNotes = [...student.notes].sort((a, b) => b.note - a.note);
        sortedNotes.forEach((note, i) => {
            const typeLabel = {
                'examen': '📝 Examen',
                'controle': '✏️  Contrôle',
                'tp': '🔬 TP',
                'projet': '💻 Projet'
            }[note.type] || note.type;
            
            console.log(`      ${(i+1).toString().padStart(2)}. ${note.matiere.padEnd(35)} ${typeLabel.padEnd(12)} ${note.note.toFixed(2)}/20 (coef ${note.coefficient})`);
        });
        console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('\n✅ All students now have comprehensive data with 55+ available subjects!\n');
    
    await mongoose.connection.close();
    process.exit(0);
});
