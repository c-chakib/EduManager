import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { dbconnect } from '../modeles/DBconnect.js';
import User from '../modeles/user.js';

function parseArgs(argv) {
  const opts = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, ...rest] = a.slice(2).split('=');
      opts[k] = rest.join('=');
    }
  }
  return opts;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['mail', 'password', 'nom', 'prenom'];
  const missing = required.filter(k => !args[k]);
  if (missing.length) {
    console.error('Missing required args:', missing.join(', '));
    console.error('Usage: node scripts/createUser.js --mail=... --password=... --nom=... --prenom=... [--role=user|admin] [--adminCode=123456]');
    process.exit(1);
  }

  const role = args.role === 'admin' ? 'admin' : 'user';
  const ADMIN_CODE = '123456';
  if (role === 'admin' && args.adminCode !== ADMIN_CODE) {
    console.error('Admin code incorrect. Provide --adminCode=123456 to create an admin.');
    process.exit(1);
  }

  try {
    await dbconnect();
    const existing = await User.findOne({ mail: args.mail });
    if (existing) {
      console.log('User already exists:', JSON.stringify({ id: existing._id.toString(), mail: existing.mail, role: existing.role }, null, 2));
      return;
    }
    const hashed = await bcrypt.hash(args.password, 10);
    const user = await User.create({ nom: args.nom, prenom: args.prenom, mail: args.mail, password: hashed, role });
    console.log('User created:', JSON.stringify({ id: user._id.toString(), mail: user.mail, role: user.role }, null, 2));
  } catch (err) {
    console.error('Create user failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
