import mongoose from 'mongoose';

const matiereSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    coefficient: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    niveau: {
        type: [String], // ['L1', 'L2', 'L3', 'M1', 'M2']
        default: []
    },
    filiere: {
        type: [String], // ['Informatique', 'Data Science', etc.]
        default: []
    },
    actif: {
        type: Boolean,
        default: true
    },
    ordre: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for filtering (nom already indexed by unique: true)
matiereSchema.index({ actif: 1 });

const Matiere = mongoose.model('Matiere', matiereSchema);

export default Matiere;
