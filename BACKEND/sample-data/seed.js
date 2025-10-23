import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import Etudiant from '../modeles/etudiants.js';
import User from '../modeles/user.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/etudiants';

async function seedDatabase() {
    try {
        // Connexion à MongoDB
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // 1. Nettoyer les collections existantes
        console.log('🧹 Nettoyage des collections...');
        await Etudiant.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Collections nettoyées\n');

        // 2. Insérer les étudiants
        console.log('👨‍🎓 Insertion des étudiants...');
        const etudiantsData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'etudiants.json'), 'utf-8')
        );
        const etudiants = await Etudiant.insertMany(etudiantsData);
        console.log(`✅ ${etudiants.length} étudiants insérés\n`);

        // 3. Créer des utilisateurs avec mots de passe hashés
        console.log('👤 Création des utilisateurs...');
        
        const users = [
            {
                nom: 'Admin',
                prenom: 'Super',
                email: 'admin@example.com',
                password: await bcrypt.hash('admin123', 10),
                role: 'admin'
            },
            {
                nom: 'Utilisateur',
                prenom: 'Test',
                email: 'user@example.com',
                password: await bcrypt.hash('user123', 10),
                role: 'user'
            },
            {
                nom: 'Dupont',
                prenom: 'Marie',
                email: 'marie.dupont@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'user'
            },
            {
                nom: 'Martin',
                prenom: 'Pierre',
                email: 'pierre.martin@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'admin'
            }
        ];

        const insertedUsers = await User.insertMany(users);
        console.log(`✅ ${insertedUsers.length} utilisateurs créés\n`);

        // 4. Afficher les comptes créés
        console.log('📋 COMPTES CRÉÉS:');
        console.log('=====================================');
        console.log('\n🔑 ADMINISTRATEURS:');
        insertedUsers
            .filter(u => u.role === 'admin')
            .forEach(u => {
                console.log(`  Email: ${u.email}`);
                console.log(`  Password: ${u.email === 'admin@example.com' ? 'admin123' : 'password123'}`);
                console.log(`  Rôle: ${u.role}`);
                console.log('  ---');
            });

        console.log('\n👤 UTILISATEURS:');
        insertedUsers
            .filter(u => u.role === 'user')
            .forEach(u => {
                const pwd = u.email === 'user@example.com' ? 'user123' : 'password123';
                console.log(`  Email: ${u.email}`);
                console.log(`  Password: ${pwd}`);
                console.log(`  Rôle: ${u.role}`);
                console.log('  ---');
            });

        console.log('\n=====================================');
        console.log('✅ Base de données initialisée avec succès!');
        console.log(`\n📊 Résumé:`);
        console.log(`   - ${etudiants.length} étudiants`);
        console.log(`   - ${insertedUsers.length} utilisateurs`);
        console.log(`   - ${insertedUsers.filter(u => u.role === 'admin').length} administrateurs`);
        console.log(`   - ${insertedUsers.filter(u => u.role === 'user').length} utilisateurs standard`);
        console.log('\n🚀 Vous pouvez maintenant démarrer l\'application!');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Déconnexion de MongoDB');
    }
}

// Exécuter le script
seedDatabase()
    .then(() => {
        console.log('\n✅ Script terminé avec succès!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });
