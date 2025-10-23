import mongoose from "mongoose";

export async function dbconnect() {
    try {
        const defaultUri = 'mongodb://127.0.0.1:27017/etudiants';
        const uri = process.env.MONGODB_URI || defaultUri;
        await mongoose.connect(uri);
        const conn = mongoose.connection;
        console.log(`Database connected successfully -> ${conn.host}:${conn.port}/${conn.name}`);
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}
