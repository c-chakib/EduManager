import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../modeles/user.js';
import readline from 'readline';

/**
 * Script to create the first super-admin account
 * Usage: node scripts/createSuperAdmin.js
 */

function parseArgs(argv) {
    const args = {};
    argv.forEach((arg) => {
        const [key, value] = arg.split('=');
        if (key.startsWith('--')) {
            const k = key.replace(/^--/, '');
            args[k] = typeof value === 'undefined' ? true : value;
        }
    });
    return args;
}

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function question(rl, q) {
    return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

async function promptPassword(rl, q) {
    // Masked password input
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const onData = (char) => {
            char = char + '';
            switch (char) {
                case '\n':
                case '\r':
                case '\u0004':
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    process.stdout.write('\n');
                    resolve(buffer.join(''));
                    break;
                case '\u0003': // Ctrl+C
                    process.stdout.write('\n');
                    process.exit(1);
                    break;
                case '\u0008': // Backspace
                case '\u007f': // Delete
                    buffer.pop();
                    process.stdout.clearLine(0);
                    process.stdout.cursorTo(0);
                    process.stdout.write(q + '*'.repeat(buffer.length));
                    break;
                default:
                    buffer.push(char);
                    process.stdout.write('*');
                    break;
            }
        };
        const buffer = [];
        process.stdout.write(q);
        stdin.resume();
        stdin.setRawMode(true);
        stdin.setEncoding('utf8');
        stdin.on('data', onData);
    });
}

function validateStrongPassword(pwd) {
    // At least 12 chars, one lowercase, one uppercase, one digit, one symbol
    const lengthOk = pwd.length >= 12;
    const lower = /[a-z]/.test(pwd);
    const upper = /[A-Z]/.test(pwd);
    const digit = /\d/.test(pwd);
    const symbol = /[^\w\s]/.test(pwd);
    return lengthOk && lower && upper && digit && symbol;
}

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/etudiants';
        await mongoose.connect(uri);
        console.log('✓ Connected to MongoDB');

        const args = parseArgs(process.argv.slice(2));

        // Option: promote existing user to super-admin
        if (args.promote) {
            const emailToPromote = args.promote;
            const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
            if (existingSuperAdmin && !args.force) {
                console.error('❌ Un super-administrateur existe déjà. Utilisez --force pour promouvoir malgré tout.');
                await mongoose.disconnect();
                process.exit(1);
            }
            const user = await User.findOne({ mail: emailToPromote });
            if (!user) {
                console.error('❌ Utilisateur à promouvoir introuvable:', emailToPromote);
                await mongoose.disconnect();
                process.exit(1);
            }
            user.role = 'super-admin';
            user.accountStatus = 'approved';
            user.isActive = true;
            user.isVerified = true;
            await user.save();
            console.log('✅ Utilisateur promu au rôle super-admin:', emailToPromote);
            await mongoose.disconnect();
            process.exit(0);
        }

        // If a super-admin already exists, block unless --force
        const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
        if (existingSuperAdmin && !args.force) {
            console.error('❌ Un super-administrateur existe déjà. Utilisez --force pour créer un autre, ou --promote=<email> pour promouvoir un compte existant.');
            await mongoose.disconnect();
            process.exit(1);
        }

        // Collect inputs
        const rl = createInterface();
        const nom = args.nom || await question(rl, 'Nom (ex: Admin): ');
        const prenom = args.prenom || await question(rl, 'Prénom (ex: Super): ');
        const mail = args.mail || args.email || await question(rl, 'Email (ex: superadmin@edumanager.com): ');

        let password = args.password;
        if (!password) {
            password = await promptPassword(rl, 'Mot de passe (min 12, Aa1!): ');
            const confirm = await promptPassword(rl, 'Confirmer le mot de passe: ');
            if (password !== confirm) {
                console.error('❌ Les mots de passe ne correspondent pas.');
                rl.close();
                await mongoose.disconnect();
                process.exit(1);
            }
        }
        rl.close();

        if (!validateStrongPassword(password)) {
            console.error('❌ Mot de passe faible. Exigences: 12+ caractères, minuscule, majuscule, chiffre, symbole.');
            await mongoose.disconnect();
            process.exit(1);
        }

        const superAdminData = {
            nom: nom || 'Admin',
            prenom: prenom || 'Super',
            mail,
            password,
            role: 'super-admin',
            accountStatus: 'approved',
            isActive: true,
            isVerified: true,
            contact: { pays: 'Maroc' },
            stats: { totalLogins: 0, studentsCreated: 0, studentsModified: 0 }
        };

        await createAdmin(superAdminData);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

async function createAdmin(superAdminData) {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
        superAdminData.password = hashedPassword;

        // Create super-admin
        const superAdmin = new User(superAdminData);
        await superAdmin.save();

    console.log('\n✅ Super-administrateur créé avec succès!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:    ${superAdminData.mail}`);
    console.log('🔑 Mot de passe: [non affiché]');
        console.log(`👤 Nom:      ${superAdminData.prenom} ${superAdminData.nom}`);
        console.log(`👑 Rôle:     super-admin`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Conservez ce mot de passe en sécurité (non affiché)');
        console.log('   2. Gardez ces identifiants en sécurité');
        console.log('   3. Ne partagez jamais ces informations');
        console.log('\n🔗 Connectez-vous sur: http://localhost:4200/auth/login\n');

        await mongoose.disconnect();
        console.log('✓ Déconnecté de MongoDB');
        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.error('❌ Erreur: Un utilisateur avec cet email existe déjà');
        } else {
            console.error('❌ Erreur lors de la création:', error.message);
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
createSuperAdmin();
