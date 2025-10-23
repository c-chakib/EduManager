import mongoose from "mongoose";

// Sous-schéma pour les notes
const noteSchema = new mongoose.Schema({
    matiere: {type: String, required: true},
    note: {type: Number, required: true, min: 0, max: 20},
    coefficient: {type: Number, default: 1, min: 1},
    date: {type: Date, default: Date.now},
    semestre: {type: String}, // "S1", "S2", etc.
    type: {type: String, enum: ['examen', 'controle', 'tp', 'projet'], default: 'examen'}
}, {_id: true});

// Sous-schéma pour les documents
const documentSchema = new mongoose.Schema({
    nom: {type: String, required: true},
    type: {type: String, enum: ['diplome', 'certificat', 'cv', 'carte_identite', 'autre'], required: true},
    url: {type: String, required: true},
    dateUpload: {type: Date, default: Date.now},
    taille: {type: Number} // en bytes
}, {_id: true});

const etudiantSchema = new mongoose.Schema({
    // Identifiants
    id: {type: Number, required: true, unique: true},
    cin: {type: String, unique: true, sparse: true, trim: true}, // CIN Marocain
    
    // Informations de base (REQUIRED)
    nom: {type: String, required: true, trim: true},
    prenom: {type: String, required: true, trim: true},
    mail: {type: String, required: true, unique: true, lowercase: true, trim: true},
    photo: {type: String, default: "Picture unavailable"},
    
    // Informations personnelles
    dateNaissance: {type: Date},
    lieuNaissance: {type: String, trim: true},
    genre: {type: String, enum: ['M', 'F', 'Autre']},
    nationalite: {type: String, default: 'Marocaine'},
    
    // Contact
    telephone: {type: String, trim: true}, // Numéro de téléphone Marocain
    telephoneParent: {type: String, trim: true}, // Numéro de téléphone du parent
    adresse: {type: String, trim: true}, // Adresse postale Maroc
    ville: {type: String, trim: true},
    codePostal: {type: String, trim: true}, // Code postal Marocain
    pays: {type: String, default: 'Maroc'},
    
    // Informations académiques
    niveau: {type: String, trim: true}, // "Licence 1", "Master 2", etc.
    filiere: {type: String, trim: true}, // "Informatique", "Mathématiques"
    matieres: {type: [String], default: []},
    anneeInscription: {type: Number}, // 2024, 2025, etc.
    statut: {
        type: String, 
        enum: ['actif', 'inactif', 'diplome', 'suspendu', 'abandonne'], 
        default: 'actif'
    },
    
    // Notes et évaluations
    notes: {type: [noteSchema], default: []},
    
    // Documents
    documents: {type: [documentSchema], default: []},
    
    // Informations complémentaires
    boursier: {type: Boolean, default: false},
    redoublant: {type: Boolean, default: false},
    remarques: {type: String, trim: true}, // Notes générales
    
    // Demo mode flag (for public demo students vs real data)
    isDemo: {type: Boolean, default: false, index: true},
    
    // User tracking - who created/updated this student
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    
}, {timestamps: true}); // Ajoute automatiquement createdAt et updatedAt

// Index pour améliorer les performances de recherche
etudiantSchema.index({nom: 1, prenom: 1});
// Pas besoin d'index supplémentaire sur mail et numeroEtudiant car déjà définis comme unique
etudiantSchema.index({statut: 1});
etudiantSchema.index({niveau: 1, filiere: 1});

// Méthode virtuelle pour calculer la moyenne générale
etudiantSchema.virtual('moyenneGenerale').get(function() {
    if (!this.notes || this.notes.length === 0) return null;
    
    let sommeNotes = 0;
    let sommeCoefficients = 0;
    
    this.notes.forEach(note => {
        sommeNotes += note.note * note.coefficient;
        sommeCoefficients += note.coefficient;
    });
    
    return sommeCoefficients > 0 ? (sommeNotes / sommeCoefficients).toFixed(2) : null;
});

// Méthode virtuelle pour l'âge
etudiantSchema.virtual('age').get(function() {
    if (!this.dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(this.dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Méthode virtuelle pour le nom complet
etudiantSchema.virtual('nomComplet').get(function() {
    return `${this.prenom} ${this.nom}`;
});

// S'assurer que les virtuels sont inclus dans les réponses JSON
etudiantSchema.set('toJSON', { virtuals: true });
etudiantSchema.set('toObject', { virtuals: true });

const Etudiant = mongoose.model('Etudiant', etudiantSchema);
export default Etudiant;
