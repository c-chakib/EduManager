import mongoose from 'mongoose';
import Matiere from './modeles/matieres.js';

mongoose.connect('mongodb://127.0.0.1:27017/etudiants')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const predefinedMatieres = [
    // Core Computer Science
    { nom: 'Mathématiques', coefficient: 3, code: 'MATH', ordre: 1 },
    { nom: 'Algorithmique', coefficient: 4, code: 'ALGO', ordre: 2 },
    { nom: 'Programmation', coefficient: 5, code: 'PROG', ordre: 3 },
    { nom: 'Structures de Données', coefficient: 4, code: 'SD', ordre: 4 },
    { nom: 'Base de Données', coefficient: 4, code: 'BDD', ordre: 5 },
    { nom: 'Systèmes d\'Exploitation', coefficient: 3, code: 'SE', ordre: 6 },
    { nom: 'Réseaux', coefficient: 3, code: 'RES', ordre: 7 },
    { nom: 'Architecture des Ordinateurs', coefficient: 2, code: 'ARCHI', ordre: 8 },
    { nom: 'Génie Logiciel', coefficient: 4, code: 'GL', ordre: 9 },
    
    // Web & Mobile Development
    { nom: 'Web Development', coefficient: 4, code: 'WEB', ordre: 10 },
    { nom: 'Développement Frontend', coefficient: 4, code: 'FRONT', ordre: 11 },
    { nom: 'Développement Backend', coefficient: 4, code: 'BACK', ordre: 12 },
    { nom: 'Développement Mobile', coefficient: 4, code: 'MOBILE', ordre: 13 },
    { nom: 'Angular', coefficient: 3, code: 'ANG-FW', ordre: 14 },
    { nom: 'React', coefficient: 3, code: 'REACT', ordre: 15 },
    { nom: 'Node.js', coefficient: 3, code: 'NODE', ordre: 16 },
    
    // Data & AI
    { nom: 'Intelligence Artificielle', coefficient: 4, code: 'IA', ordre: 17 },
    { nom: 'Machine Learning', coefficient: 4, code: 'ML', ordre: 18 },
    { nom: 'Data Science', coefficient: 4, code: 'DS', ordre: 19 },
    { nom: 'Big Data', coefficient: 3, code: 'BD', ordre: 20 },
    { nom: 'Analyse de Données', coefficient: 3, code: 'AD', ordre: 21 },
    { nom: 'Python pour Data Science', coefficient: 3, code: 'PY-DS', ordre: 22 },
    
    // Security & Networks
    { nom: 'Sécurité Informatique', coefficient: 4, code: 'SECU', ordre: 23 },
    { nom: 'Cybersécurité', coefficient: 4, code: 'CYBER', ordre: 24 },
    { nom: 'Cryptographie', coefficient: 3, code: 'CRYPTO', ordre: 25 },
    { nom: 'Ethical Hacking', coefficient: 3, code: 'HACK', ordre: 26 },
    { nom: 'Administration Réseaux', coefficient: 3, code: 'ADMIN', ordre: 27 },
    { nom: 'Cloud Computing', coefficient: 4, code: 'CLOUD', ordre: 28 },
    
    // Software Engineering & DevOps
    { nom: 'UML & Conception', coefficient: 3, code: 'UML', ordre: 29 },
    { nom: 'Tests Logiciels', coefficient: 3, code: 'TEST', ordre: 30 },
    { nom: 'DevOps', coefficient: 4, code: 'DEVOPS', ordre: 31 },
    { nom: 'CI/CD', coefficient: 3, code: 'CICD', ordre: 32 },
    { nom: 'Docker & Kubernetes', coefficient: 3, code: 'DOCKER', ordre: 33 },
    { nom: 'Git & Versioning', coefficient: 2, code: 'GIT', ordre: 34 },
    
    // Database & Systems
    { nom: 'SQL Avancé', coefficient: 3, code: 'SQL', ordre: 35 },
    { nom: 'NoSQL', coefficient: 3, code: 'NOSQL', ordre: 36 },
    { nom: 'MongoDB', coefficient: 3, code: 'MONGO', ordre: 37 },
    { nom: 'Systèmes Distribués', coefficient: 4, code: 'DIST', ordre: 38 },
    
    // Programming Languages
    { nom: 'Java', coefficient: 4, code: 'JAVA', ordre: 39 },
    { nom: 'Python', coefficient: 4, code: 'PY', ordre: 40 },
    { nom: 'C++', coefficient: 3, code: 'CPP', ordre: 41 },
    { nom: 'JavaScript', coefficient: 4, code: 'JS', ordre: 42 },
    { nom: 'TypeScript', coefficient: 3, code: 'TS', ordre: 43 },
    
    // Management & Soft Skills
    { nom: 'Gestion de Projet', coefficient: 3, code: 'GP', ordre: 44 },
    { nom: 'Méthodes Agiles', coefficient: 3, code: 'AGILE', ordre: 45 },
    { nom: 'Management', coefficient: 2, code: 'MGMT', ordre: 46 },
    { nom: 'Communication', coefficient: 2, code: 'COM', ordre: 47 },
    
    // Languages & General
    { nom: 'Anglais Technique', coefficient: 3, code: 'ANG', ordre: 48 },
    { nom: 'Français', coefficient: 2, code: 'FR', ordre: 49 },
    { nom: 'Économie Numérique', coefficient: 2, code: 'ECO', ordre: 50 }
];

async function seedMatieres() {
    try {
        console.log('🌱 Seeding matières...');
        
        // Check if matieres already exist
        const count = await Matiere.countDocuments();
        
        if (count > 0) {
            console.log(`📚 Found ${count} existing matières in database`);
            console.log('🔄 Updating with new matières...\n');
            
            let added = 0;
            let skipped = 0;
            
            for (const matiere of predefinedMatieres) {
                const existing = await Matiere.findOne({ nom: matiere.nom });
                if (!existing) {
                    await Matiere.create(matiere);
                    console.log(`   ✅ Added: ${matiere.nom} (${matiere.code})`);
                    added++;
                } else {
                    skipped++;
                }
            }
            
            const newCount = await Matiere.countDocuments();
            console.log(`\n📊 Summary:`);
            console.log(`   ✅ ${added} new matières added`);
            console.log(`   ℹ️  ${skipped} matières already existed`);
            console.log(`   📚 Total matières in database: ${newCount}`);
            
        } else {
            console.log('📝 No matières found, inserting predefined list...');
            
            // Insert all predefined matieres
            const result = await Matiere.insertMany(predefinedMatieres);
            
            console.log(`\n✅ Successfully created ${result.length} matières!`);
            console.log('\n📚 Matières List:');
            result.forEach((m, i) => {
                console.log(`   ${i + 1}. ${m.nom} (${m.code}) - Coefficient: ${m.coefficient}`);
            });
        }
        
    } catch (error) {
        if (error.code === 11000) {
            console.log('⚠️  Some matières already exist (duplicate key)');
        } else {
            console.error('❌ Error seeding matières:', error);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

seedMatieres();
