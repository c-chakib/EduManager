import mongoose from 'mongoose';
import { dbconnect } from '../modeles/DBconnect.js';
import Etudiant from '../modeles/etudiants.js';
import User from '../modeles/user.js';
import ChatbotResponse from '../modeles/chatbot.js';

async function main() {
  try {
    await dbconnect();
    const conn = mongoose.connection;
    const collections = await conn.db.listCollections().toArray();
    const names = collections.map(c => c.name).sort();
    const counts = {};
    if (names.includes('etudiants')) counts.etudiants = await Etudiant.countDocuments().catch(() => 0);
    if (names.includes('users')) counts.users = await User.countDocuments().catch(() => 0);
    if (names.includes('chatbotresponses')) counts.chatbotresponses = await ChatbotResponse.countDocuments().catch(() => 0);
    console.log(JSON.stringify({ db: conn.name, host: conn.host, collections: names, counts }, null, 2));
  } catch (err) {
    console.error('Diagnose failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
