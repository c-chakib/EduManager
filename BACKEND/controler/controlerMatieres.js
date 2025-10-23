import Matiere from '../modeles/matieres.js';

// Get all active matières
export async function GetAllMatieres(req, res, next) {
    try {
        const matieres = await Matiere.find({ actif: true })
            .sort({ ordre: 1, nom: 1 })
            .select('nom code coefficient description');
        
        // Return just the names as an array for compatibility
        const matieresList = matieres.map(m => m.nom);
        
        res.status(200).json(matieresList);
    } catch (error) {
        next(error);
    }
}

// Get all matières with full details (for admin)
export async function GetAllMatieresDetails(req, res, next) {
    try {
        const matieres = await Matiere.find()
            .sort({ ordre: 1, nom: 1 });
        
        res.status(200).json(matieres);
    } catch (error) {
        next(error);
    }
}

// Get matiere by ID
export async function GetMatiereById(req, res, next) {
    try {
        const matiere = await Matiere.findById(req.params.id);
        
        if (!matiere) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }
        
        res.status(200).json(matiere);
    } catch (error) {
        next(error);
    }
}

// Create new matière
export async function CreateMatiere(req, res, next) {
    try {
        // Check for existing matiere with same name
        const existing = await Matiere.findOne({ nom: req.body.nom });
        if (existing) {
            return res.status(400).json({ 
                message: 'Une matière avec ce nom existe déjà' 
            });
        }
        
        const matiere = new Matiere(req.body);
        const saved = await matiere.save();
        
        res.status(201).json(saved);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Une matière avec ces informations existe déjà'
            });
        }
        next(error);
    }
}

// Update matière
export async function UpdateMatiere(req, res, next) {
    try {
        const matiere = await Matiere.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!matiere) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }
        
        res.status(200).json(matiere);
    } catch (error) {
        next(error);
    }
}

// Delete (soft delete - set actif to false)
export async function DeleteMatiere(req, res, next) {
    try {
        const matiere = await Matiere.findByIdAndUpdate(
            req.params.id,
            { actif: false },
            { new: true }
        );
        
        if (!matiere) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }
        
        res.status(200).json({ 
            message: 'Matière désactivée avec succès',
            matiere 
        });
    } catch (error) {
        next(error);
    }
}

// Permanent delete (for admin only)
export async function PermanentDeleteMatiere(req, res, next) {
    try {
        const matiere = await Matiere.findByIdAndDelete(req.params.id);
        
        if (!matiere) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }
        
        res.status(200).json({ 
            message: 'Matière supprimée définitivement',
            matiere 
        });
    } catch (error) {
        next(error);
    }
}

// Reactivate matière
export async function ReactivateMatiere(req, res, next) {
    try {
        const matiere = await Matiere.findByIdAndUpdate(
            req.params.id,
            { actif: true },
            { new: true }
        );
        
        if (!matiere) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }
        
        res.status(200).json({ 
            message: 'Matière réactivée avec succès',
            matiere 
        });
    } catch (error) {
        next(error);
    }
}
