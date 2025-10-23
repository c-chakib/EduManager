import mongoose from "mongoose";

// Sous-schéma pour les préférences utilisateur
const preferencesSchema = new mongoose.Schema({
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, enum: ['fr', 'en', 'ar'], default: 'fr' },
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
        sms: { type: Boolean, default: false }
    },
    itemsPerPage: { type: Number, default: 12, min: 8, max: 100 }
}, { _id: false });

// Sous-schéma pour les informations de contact
const contactSchema = new mongoose.Schema({
    cin: { type: String, trim: true, unique: true }, // CIN Marocain
    telephone: { type: String, trim: true }, // Numéro de téléphone Marocain
    telephoneMobile: { type: String, trim: true }, // Numéro mobile Marocain
    adresse: { type: String, trim: true }, // Adresse postale Maroc
    ville: { type: String, trim: true },
    codePostal: { type: String, trim: true }, // Code postal Marocain
    pays: { type: String, default: 'Maroc' }
}, { _id: false });

const auditEntrySchema = new mongoose.Schema({
    action: { type: String, enum: ['register', 'approve', 'reject', 'suspend', 'reactivate', 'update'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    reason: { type: String },
    meta: { type: Object }
}, { _id: false });

const userSchema = new mongoose.Schema({
    // Informations de base (requises)
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    mail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    
    // Rôle et permissions
    role: { 
        type: String, 
        enum: ['user', 'admin', 'moderator', 'teacher', 'student', 'super-admin'], 
        default: "user" 
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'delete', 'manage_users', 'manage_students', 'view_analytics']
    }],
    
    // Account status for admin approval
    accountStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'approved' // Normal users are auto-approved, admins go to pending
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionDate: { type: Date },
    
    // Informations personnelles
    dateNaissance: { type: Date },
    genre: { type: String, enum: ['M', 'F', 'Autre', 'Non spécifié'], default: 'Non spécifié' },
    photo: { type: String, default: '' }, // URL vers l'avatar
    bio: { type: String, maxlength: 500, default: '' },
    
    // Informations de contact
    contact: { type: contactSchema, default: () => ({}) },
    
    // Préférences utilisateur
    preferences: { type: preferencesSchema, default: () => ({}) },
    
    // Statut du compte
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Informations de connexion
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    
    // Statistiques
    stats: {
        totalLogins: { type: Number, default: 0 },
        studentsCreated: { type: Number, default: 0 },
        studentsModified: { type: Number, default: 0 }
    },

    // Audit log
    auditLog: { type: [auditEntrySchema], default: [] }
}, {
    timestamps: true
});

// Méthode virtuelle pour obtenir le nom complet
userSchema.virtual('nomComplet').get(function() {
    return `${this.prenom} ${this.nom}`;
});

// Méthode virtuelle pour calculer l'âge
userSchema.virtual('age').get(function() {
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

// Méthode virtuelle pour vérifier si le compte est verrouillé
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index pour améliorer les performances de recherche
userSchema.index({ mail: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// S'assurer que les virtuels sont inclus dans JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;