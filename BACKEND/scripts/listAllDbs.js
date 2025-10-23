import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/etudiants';

async function main() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    await mongoose.connect(uri);
    const conn = mongoose.connection;
    const client = conn.getClient();
    const admin = client.db().admin();

    const { databases } = await admin.listDatabases();
    const result = [];
    for (const dbInfo of databases) {
      const name = dbInfo.name;
      if (name === 'admin' || name === 'local' || name === 'config') continue;
      const db = client.db(name);
      const collections = (await db.listCollections().toArray()).map(c => c.name);
      const counts = {};
      if (collections.includes('users')) counts.users = await db.collection('users').countDocuments().catch(() => 0);
      if (collections.includes('etudiants')) counts.etudiants = await db.collection('etudiants').countDocuments().catch(() => 0);
      result.push({ db: name, collections, counts });
    }
    console.log(JSON.stringify({ connectedTo: uri, host: conn.host, port: conn.port, databases: result }, null, 2));
  } catch (err) {
    console.error('List DBs failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
