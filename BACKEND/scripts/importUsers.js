import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { dbconnect } from '../modeles/DBconnect.js';
import User from '../modeles/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    await dbconnect();
    const filePath = path.resolve(__dirname, '..', 'data', 'users.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}. Copy and edit data/users.sample.json to data/users.json`);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) throw new Error('Invalid JSON: expected an array of users');

    let upserts = 0;
    for (const u of items) {
      if (!u || typeof u !== 'object') continue;
      const { mail, password, nom, prenom } = u;
      if (!mail || !password || !nom || !prenom) continue;
      const role = u.role === 'admin' ? 'admin' : 'user';
      const hashed = await bcrypt.hash(password, 10);
      const res = await User.updateOne(
        { mail },
        { $set: { nom, prenom, mail, password: hashed, role } },
        { upsert: true }
      );
      if (res.upsertedCount > 0 || res.modifiedCount > 0) upserts += 1;
    }
    const total = await User.countDocuments();
    console.log(JSON.stringify({ usersUpsertedOrUpdated: upserts, totalUsers: total }, null, 2));
  } catch (err) {
    console.error('Import users failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
