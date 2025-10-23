import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dbconnect } from '../modeles/DBconnect.js';
import Etudiant from '../modeles/etudiants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    await dbconnect();
    const filePath = path.resolve(__dirname, '..', 'etudiants.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Invalid JSON: expected array');

    let upserts = 0;
    for (const s of data) {
      if (!s || typeof s !== 'object') continue;
      const { id, mail } = s;
      if (!id || !mail) continue; // require identity fields
      const res = await Etudiant.updateOne({ id }, { $set: s }, { upsert: true });
      if (res.upsertedCount > 0 || res.modifiedCount > 0) upserts += 1;
    }
    const total = await Etudiant.countDocuments();
    console.log(JSON.stringify({ restored: upserts, total }, null, 2));
  } catch (err) {
    console.error('Restore failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
