import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';
import { dbconnect } from './modeles/DBconnect.js';

async function clearDuplicates() {
    try {
        await dbconnect();
        console.log('Connected to database');
        const args = process.argv.slice(2);
        const dryRun = args.includes('--dry-run');
        const confirm = args.includes('--confirm');
        if (!confirm) {
            console.warn('Safety: This script will only log actions unless you pass --confirm. Use --dry-run to simulate.');
        }
        
        // Find all students
        const students = await Etudiant.find();
        console.log(`Found ${students.length} students in database`);
        
        // Group by email to find duplicates
        const emailGroups = {};
        const idGroups = {};
        
        students.forEach(student => {
            // Group by email (skip empty)
            const email = (student.mail || '').trim();
            if (email) {
                if (!emailGroups[email]) emailGroups[email] = [];
                emailGroups[email].push(student);
            }
            // Group by ID (skip null/undefined)
            const sid = student.id;
            if (sid !== undefined && sid !== null) {
                if (!idGroups[sid]) idGroups[sid] = [];
                idGroups[sid].push(student);
            }
        });
        
        // Remove duplicates by email
        for (const [email, duplicates] of Object.entries(emailGroups)) {
            if (duplicates.length > 1) {
                console.log(`Found ${duplicates.length} students with email: ${email}`);
                // Keep the first one, remove the rest
                for (let i = 1; i < duplicates.length; i++) {
                    if (!confirm || dryRun) {
                        console.log(`[DRY] Would remove duplicate student _id=${duplicates[i]._id} email=${email}`);
                    } else {
                        await Etudiant.deleteOne({ _id: duplicates[i]._id });
                        console.log(`Removed duplicate student with email: ${email}`);
                    }
                }
            }
        }
        
        // Remove duplicates by ID
        for (const [id, duplicates] of Object.entries(idGroups)) {
            if (duplicates.length > 1) {
                console.log(`Found ${duplicates.length} students with ID: ${id}`);
                // Keep the first one, remove the rest
                for (let i = 1; i < duplicates.length; i++) {
                    if (!confirm || dryRun) {
                        console.log(`[DRY] Would remove duplicate student _id=${duplicates[i]._id} id=${id}`);
                    } else {
                        await Etudiant.deleteOne({ _id: duplicates[i]._id });
                        console.log(`Removed duplicate student with ID: ${id}`);
                    }
                }
            }
        }
        
        const finalCount = await Etudiant.countDocuments();
        console.log(`Database cleaned. Final student count: ${finalCount}`);
        
    } catch (error) {
        console.error('Error clearing duplicates:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

clearDuplicates();