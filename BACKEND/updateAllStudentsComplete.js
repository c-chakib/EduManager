import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';
import Matiere from './modeles/matieres.js';

// Connection MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/etudiants');

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB');
    updateAllStudents();
});

// Helper function to generate random data
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function updateAllStudents() {
    try {
        console.log('🔄 Starting comprehensive student update...\n');
        
        // Get all active matieres
        const allMatieres = await Matiere.find({ actif: true }).sort({ ordre: 1 });
        console.log(`📚 Found ${allMatieres.length} active matières in database\n`);
        
        // Get all students (non-demo)
        const students = await Etudiant.find({ isDemo: { $ne: true } });
        console.log(`👥 Found ${students.length} students to update\n`);
        
        let updated = 0;
        const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
        const filieres = [
            'Intelligence Artificielle',
            'Data Science',
            'Génie Logiciel',
            'Développement Web',
            'Cybersécurité',
            'Réseaux et Sécurité',
            'Informatique'
        ];
        const villes = [
            'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
            'Louga', 'Tambacounda', 'Kolda', 'Diourbel', 'Matam',
            'Rufisque', 'Mbour', 'Touba', 'Pikine', 'Guédiawaye'
        ];
        
        for (const student of students) {
            let changes = [];
            
            // 1. Ensure dateNaissance exists and is valid
            if (!student.dateNaissance || isNaN(new Date(student.dateNaissance).getTime())) {
                const age = student.age || randomInt(18, 30);
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - age;
                student.dateNaissance = generateRandomDate(
                    new Date(birthYear, 0, 1),
                    new Date(birthYear, 11, 31)
                );
                changes.push('dateNaissance');
            }
            
            // 2. Calculate proper age from dateNaissance
            const today = new Date();
            const birthDate = new Date(student.dateNaissance);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (student.age !== age) {
                student.age = age;
                changes.push('age');
            }
            
            // 3. Ensure genre exists
            if (!student.genre || !['M', 'F'].includes(student.genre)) {
                student.genre = randomChoice(['M', 'F']);
                changes.push('genre');
            }
            
            // 4. Ensure niveau exists
            if (!student.niveau || !niveaux.includes(student.niveau)) {
                student.niveau = randomChoice(niveaux);
                changes.push('niveau');
            }
            
            // 5. Ensure filiere exists
            if (!student.filiere || !filieres.includes(student.filiere)) {
                student.filiere = randomChoice(filieres);
                changes.push('filiere');
            }
            
            // 6. Ensure email exists
            if (!student.mail || student.mail === 'email@example.com') {
                const cleanName = student.nom.toLowerCase().replace(/[^a-z]/g, '');
                const cleanPrenom = student.prenom.toLowerCase().replace(/[^a-z]/g, '');
                student.mail = `${cleanPrenom}.${cleanName}@etudiant.sn`;
                changes.push('mail');
            }
            
            // 7. Ensure telephone exists
            if (!student.telephone || student.telephone === '+212 600 000 000') {
                student.telephone = `+221 77 ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`;
                changes.push('telephone');
            }
            
            // 8. Ensure adresse exists
            if (!student.adresse || student.adresse === 'Adresse inconnue') {
                student.adresse = `${randomInt(1, 500)} Rue ${randomInt(1, 50)}, ${randomChoice(villes)}`;
                changes.push('adresse');
            }
            
            // 9. Ensure boursier exists
            if (student.boursier === undefined || student.boursier === null) {
                student.boursier = Math.random() < 0.3; // 30% scholarship
                changes.push('boursier');
            }
            
            // 10. REGENERATE ALL NOTES with new comprehensive matières
            const numMatieres = randomInt(8, 12); // More subjects per student
            const selectedMatieres = [];
            
            // Ensure all students have core subjects
            const coreMatieres = allMatieres.filter(m => 
                ['Mathématiques', 'Algorithmique', 'Programmation'].includes(m.nom)
            );
            selectedMatieres.push(...coreMatieres);
            
            // Add random additional subjects
            const remainingMatieres = allMatieres.filter(m => 
                !coreMatieres.includes(m)
            );
            
            while (selectedMatieres.length < numMatieres && remainingMatieres.length > 0) {
                const randomIndex = Math.floor(Math.random() * remainingMatieres.length);
                const matiere = remainingMatieres.splice(randomIndex, 1)[0];
                selectedMatieres.push(matiere);
            }
            
            // Generate notes for selected matieres
            const newNotes = [];
            const newMatieres = [];
            
            // Base note according to level
            const baseNote = {
                'L1': 11,
                'L2': 12,
                'L3': 13,
                'M1': 14,
                'M2': 15
            }[student.niveau] || 12;
            
            for (const matiere of selectedMatieres) {
                const variation = (Math.random() * 8) - 2; // -2 to +6
                const note = Math.max(0, Math.min(20, baseNote + variation));
                
                newNotes.push({
                    matiere: matiere.nom,
                    note: parseFloat(note.toFixed(2)),
                    coefficient: matiere.coefficient,
                    type: randomChoice(['examen', 'controle', 'tp', 'projet']),
                    date: generateRandomDate(
                        new Date(2024, 0, 1),
                        new Date(2024, 11, 31)
                    )
                });
                
                newMatieres.push(matiere.nom);
            }
            
            student.notes = newNotes;
            student.matieres = newMatieres;
            changes.push('notes', 'matieres');
            
            // 11. Calculate moyenne
            let totalNotes = 0;
            let totalCoefficients = 0;
            
            for (const note of student.notes) {
                totalNotes += note.note * note.coefficient;
                totalCoefficients += note.coefficient;
            }
            
            const newMoyenne = totalCoefficients > 0 ? totalNotes / totalCoefficients : 0;
            if (Math.abs(student.moyenne - newMoyenne) > 0.01) {
                student.moyenne = parseFloat(newMoyenne.toFixed(2));
                changes.push('moyenne');
            }
            
            // Save student
            await student.save();
            updated++;
            
            if (updated % 10 === 0) {
                console.log(`✅ Updated ${updated}/${students.length} students...`);
            }
        }
        
        console.log(`\n🎉 Successfully updated ${updated} students!`);
        
        // Display summary statistics
        const allStudentsUpdated = await Etudiant.find({ isDemo: { $ne: true } });
        
        const stats = {
            totalStudents: allStudentsUpdated.length,
            males: allStudentsUpdated.filter(s => s.genre === 'M').length,
            females: allStudentsUpdated.filter(s => s.genre === 'F').length,
            boursiers: allStudentsUpdated.filter(s => s.boursier).length,
            avgAge: (allStudentsUpdated.reduce((sum, s) => sum + s.age, 0) / allStudentsUpdated.length).toFixed(1),
            avgMoyenne: (allStudentsUpdated.reduce((sum, s) => sum + s.moyenne, 0) / allStudentsUpdated.length).toFixed(2),
            avgSubjectsPerStudent: (allStudentsUpdated.reduce((sum, s) => sum + s.notes.length, 0) / allStudentsUpdated.length).toFixed(1)
        };
        
        console.log('\n📊 Database Statistics:');
        console.log(`   👥 Total Students: ${stats.totalStudents}`);
        console.log(`   👨 Males: ${stats.males} (${(stats.males/stats.totalStudents*100).toFixed(1)}%)`);
        console.log(`   👩 Females: ${stats.females} (${(stats.females/stats.totalStudents*100).toFixed(1)}%)`);
        console.log(`   🎓 Boursiers: ${stats.boursiers} (${(stats.boursiers/stats.totalStudents*100).toFixed(1)}%)`);
        console.log(`   📅 Average Age: ${stats.avgAge} years`);
        console.log(`   📈 Average Moyenne: ${stats.avgMoyenne}/20`);
        console.log(`   📚 Average Subjects per Student: ${stats.avgSubjectsPerStudent}`);
        
        // Count unique subjects in database
        const uniqueSubjects = new Set();
        allStudentsUpdated.forEach(s => {
            s.matieres.forEach(m => uniqueSubjects.add(m));
        });
        console.log(`   📖 Unique Subjects in Use: ${uniqueSubjects.size}`);
        
    } catch (error) {
        console.error('❌ Error updating students:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}
