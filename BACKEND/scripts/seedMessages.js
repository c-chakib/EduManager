import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dbconnect } from '../modeles/DBconnect.js';
import Message from '../modeles/message.js';
import User from '../modeles/user.js';

dotenv.config();

const seedMessages = async () => {
  try {
    await dbconnect();
    console.log('Connected to database');

    // Get some existing users
    const users = await User.find().limit(3).select('_id nom prenom');
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users for seeding messages`);

    // Sample messages
    const sampleMessages = [
      {
        senderId: users[0]._id,
        senderName: `${users[0].prenom} ${users[0].nom}`,
        content: "Bonjour à tous ! Bienvenue sur le chat général.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true
      },
      {
        senderId: users[1]._id,
        senderName: `${users[1].prenom} ${users[1].nom}`,
        content: "Salut ! Content de voir que le chat fonctionne.",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        read: true
      },
      {
        senderId: users[0]._id,
        senderName: `${users[0].prenom} ${users[0].nom}`,
        content: "Oui, c'est super ! On peut discuter de tous les sujets ici.",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        read: true
      },
      {
        senderId: users[users.length > 2 ? 2 : 0]._id,
        senderName: `${users[users.length > 2 ? 2 : 0].prenom} ${users[users.length > 2 ? 2 : 0].nom}`,
        content: "Parfait ! N'hésitez pas à poser vos questions.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: true
      },
      {
        senderId: users[1]._id,
        senderName: `${users[1].prenom} ${users[1].nom}`,
        content: "Le système de chat persiste maintenant l'historique des messages !",
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        read: false
      }
    ];

    // Clear existing messages
    await Message.deleteMany({});
    console.log('Cleared existing messages');

    // Insert sample messages
    const insertedMessages = await Message.insertMany(sampleMessages);
    console.log(`Seeded ${insertedMessages.length} messages successfully`);

    // Display inserted messages
    console.log('\nInserted messages:');
    insertedMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.senderName}: ${msg.content}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding messages:', error);
    process.exit(1);
  }
};

seedMessages();