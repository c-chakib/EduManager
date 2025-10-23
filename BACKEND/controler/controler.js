import Etudiant from "../modeles/etudiants.js";
import { io } from "../index.js";

export async function GetAllEtudiants(req, res, next) {
    try {
        // Pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        // Filter params
        const searchTerm = req.query.search || '';
        const matiereParam = req.query.matiere || '';
        const sortBy = req.query.sortBy || 'nom_asc';
        const isDemo = req.query.isDemo; // 'true', 'false', or undefined

        // Build query filter
        const filter = {};

        // isDemo filter (for demo mode vs authenticated mode)
        if (isDemo === 'true') {
            // Demo mode: only show demo students
            filter.isDemo = true;
        } else if (isDemo === undefined) {
            // Authenticated mode: only show real (non-demo) students
            filter.isDemo = { $ne: true };
        }
        // If isDemo === 'false', show all students (admin override)

        // Search filter (nom, prenom, mail)
        if (searchTerm) {
            filter.$or = [
                { nom: { $regex: searchTerm, $options: 'i' } },
                { prenom: { $regex: searchTerm, $options: 'i' } },
                { mail: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Matiere filter (multiple matieres supported)
        if (matiereParam) {
            // Split comma-separated string into array
            const matieres = matiereParam.split(',').map(m => m.trim()).filter(m => m);
            if (matieres.length > 0) {
                filter.matieres = { $in: matieres };
            }
        }

        // Build sort object
        let sort = {};
        switch (sortBy) {
            case 'nom_asc':
                sort = { nom: 1 };
                break;
            case 'nom_desc':
                sort = { nom: -1 };
                break;
            case 'prenom_asc':
                sort = { prenom: 1 };
                break;
            case 'prenom_desc':
                sort = { prenom: -1 };
                break;
            case 'id_asc':
                sort = { id: 1, _id: 1 }; // Add _id as secondary sort for consistency
                break;
            case 'id_desc':
                sort = { id: -1, _id: -1 }; // Add _id as secondary sort for consistency
                break;
            case 'date_asc':
                sort = { createdAt: 1 };
                break;
            case 'date_desc':
                sort = { createdAt: -1 };
                break;
            default:
                sort = { nom: 1 };
        }

        console.log('🔍 Query filter:', JSON.stringify(filter));
        console.log('📊 Sort by:', sortBy, '→', JSON.stringify(sort));

        // Execute queries with filters
        // Build the query with proper collation applied throughout the chain
        let queryBuilder = Etudiant.find(filter).sort(sort).skip(skip).limit(limit);
        
        // When sorting by id, apply collation with numericOrdering to handle string/number ids correctly
        if (sortBy && sortBy.startsWith('id_')) {
            queryBuilder = queryBuilder.collation({ locale: 'en', numericOrdering: true });
        }

        const [data, total] = await Promise.all([
            queryBuilder.exec(),
            Etudiant.countDocuments(filter)
        ]);

        console.log('✅ Found', data.length, 'students, total:', total);
        if (data.length > 0) {
            console.log('📌 First student ID:', data[0].id, 'Last student ID:', data[data.length - 1].id);
        }

        res.status(200).json({ data, total, page, limit });
    } catch (error) {
        next(error);
    }
}
export async function GetEtudiantById(req, res, next) {
    try { 
        const etudiants = await Etudiant.findOne({id:req.params.id});
        res.status(200).json(etudiants);
    } catch (error) {
        next(error);
    }
}
export async function CreateEtudiant(req, res, next) {
    try {
        // Check for existing email
        const existingEmail = await Etudiant.findOne({ mail: req.body.mail });
        if (existingEmail) {
            return res.status(400).json({ 
                message: 'Un étudiant avec cette adresse email existe déjà' 
            });
        }
        
        // Auto-generate ID based on the last created student
        const lastStudent = await Etudiant.findOne().sort({ id: -1 });
        const nextId = lastStudent ? lastStudent.id + 1 : 1;
        
        // Get user ID from authentication middleware
        const userId = req.user?.userId;
        
        // Create new student with auto-generated ID and Moroccan fields
        const {
            nom, prenom, mail, cin, telephone, telephoneParent,
            adresse, ville, codePostal, pays = 'Maroc', nationalite = 'Marocaine',
            ...rest
        } = req.body;
        const studentData = {
            nom, prenom, mail, cin, telephone, telephoneParent,
            adresse, ville, codePostal, pays, nationalite,
            id: nextId,
            createdBy: userId, // Track who created this student
            ...rest
        };
        const newEtudiant = new Etudiant(studentData);
        const savedEtudiant = await newEtudiant.save();
        
        // Update user stats
        if (userId) {
            await import('../modeles/user.js').then(module => {
                const User = module.default;
                User.findByIdAndUpdate(userId, {
                    $inc: { 'stats.studentsCreated': 1 }
                }).exec().catch(err => console.error('Failed to update user stats:', err));
            });
        }
        
        // Emit Socket.io event for real-time updates
        io.emit('studentCreated', savedEtudiant);
        console.log('[Socket.io] Emitted studentCreated event for student:', savedEtudiant.id);
        
        res.status(201).json(savedEtudiant);
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
            return res.status(400).json({
                message: `Un étudiant avec cette ${duplicateField === 'mail' ? 'adresse email' : 'valeur'} existe déjà`
            });
        }
        
        console.error('Error creating student:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'étudiant' });
    }
}
export async function UpdateEtudiant(req, res, next) {
    try {
        // Get user ID from authentication middleware
        const userId = req.user?.userId;
        
        // Add updatedBy to the update data
        const updateData = {
            ...req.body,
            updatedBy: userId
        };
        
        const etudiant = await Etudiant.findOneAndUpdate(
            {id:req.params.id}, 
            updateData, 
            {new: true}
        );
        
        // Update user stats
        if (userId && etudiant) {
            await import('../modeles/user.js').then(module => {
                const User = module.default;
                User.findByIdAndUpdate(userId, {
                    $inc: { 'stats.studentsModified': 1 }
                }).exec().catch(err => console.error('Failed to update user stats:', err));
            });
        }
        
        // Emit Socket.io event for real-time updates
        if (etudiant) {
            io.emit('studentUpdated', etudiant);
            console.log('[Socket.io] Emitted studentUpdated event for student:', etudiant.id);
        }
        
        res.status(200).json(etudiant);
    } catch (error) {
        next(error);
    }
}
export async function DeleteEtudiant(req, res, next) {
    try {
        const etudiant = await Etudiant.findOneAndDelete({id:req.params.id});
        
        // Emit Socket.io event for real-time updates
        if (etudiant) {
            io.emit('studentDeleted', { student: { id: req.params.id } });
            console.log('[Socket.io] Emitted studentDeleted event for student:', req.params.id);
        }
        
        res.status(200).json(etudiant);
    } catch (error) {
        next(error);
    }
}
