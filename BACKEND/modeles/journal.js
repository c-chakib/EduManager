import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'create', 'update', 'delete', 'login', etc.
  collection: { type: String, required: true }, // e.g. 'etudiants', 'users', etc.
  documentId: { type: String }, // _id or id of affected document
  dataBefore: { type: mongoose.Schema.Types.Mixed }, // previous state (for update/delete)
  dataAfter: { type: mongoose.Schema.Types.Mixed }, // new state (for create/update)
  user: {
    id: { type: String },
    nom: { type: String },
    prenom: { type: String },
    role: { type: String }
  },
  timestamp: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed } // any extra info
});

export default mongoose.model('Journal', JournalSchema);