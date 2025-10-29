// Bulk export all students as JSON
export async function BulkExportEtudiantsJSON(req, res, next) {
    try {
        const students = await Etudiant.find({});
        res.header('Content-Type', 'application/json');
        res.attachment('etudiants_export.json');
        res.send(JSON.stringify(students, null, 2));
    } catch (error) {
        next(error);
    }
}

// Bulk import students from JSON
export async function BulkImportEtudiantsJSON(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier reçu.' });
        }
        const raw = await fs.promises.readFile(req.file.path, 'utf-8');
        let students;
        try {
            students = JSON.parse(raw);
        } catch (err) {
            return res.status(400).json({ message: 'Fichier JSON invalide.' });
        }
        if (!Array.isArray(students)) {
            return res.status(400).json({ message: 'Le fichier doit contenir un tableau d\'étudiants.' });
        }
        const inserted = [];
        const errors = [];
        for (const student of students) {
            try {
                const exists = await Etudiant.findOne({ mail: student.mail });
                if (exists) {
                    errors.push({ student, error: 'Email déjà utilisé.' });
                    continue;
                }
                const newStudent = new Etudiant(student);
                await newStudent.save();
                inserted.push(newStudent);
            } catch (err) {
                errors.push({ student, error: err.message });
            }
        }
        res.status(200).json({ inserted: inserted.length, errors });
    } catch (error) {
        next(error);
    }
}
// Export only selected students as CSV
export async function BulkExportSelectedStudents(req, res, next) {
    try {
        const ids = req.body.ids;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Aucun étudiant sélectionné.' });
        }
        // Dynamically get all exportable fields from the schema
        const allFields = Object.keys(Etudiant.schema.paths).filter(f => !['_id', '__v'].includes(f));
        // Get selected students
        const students = await Etudiant.find({ id: { $in: ids } }, allFields.join(' '));
        // Build CSV
        let csv = allFields.join(',') + '\n';
        for (const s of students) {
            csv += allFields.map(col => {
                let val = s[col];
                // Handle arrays of objects (notes, documents)
                if (col === 'notes' && Array.isArray(val)) {
                    // Export summary: matiere:note:type
                    return val.map(note => {
                        const matiere = note.matiere ? String(note.matiere).replace(/[,;]/g, ' ') : '';
                        const noteVal = note.note !== undefined ? String(note.note) : '';
                        const type = note.type ? String(note.type).replace(/[,;]/g, ' ') : '';
                        return `${matiere}:${noteVal}:${type}`;
                    }).join(';');
                }
                if (col === 'documents' && Array.isArray(val)) {
                    // Export summary: nom:type
                    return val.map(doc => {
                        const nom = doc.nom ? String(doc.nom).replace(/[,;]/g, ' ') : '';
                        const type = doc.type ? String(doc.type).replace(/[,;]/g, ' ') : '';
                        return `${nom}:${type}`;
                    }).join(';');
                }
                // Handle simple arrays (matieres)
                if (Array.isArray(val)) {
                    return val.map(v => String(v).replace(/[,;]/g, ' ')).join(';');
                }
                // Handle objects (flatten or export empty)
                if (typeof val === 'object' && val !== null) {
                    return '';
                }
                // Escape commas and semicolons in strings
                return val ? String(val).replace(/[,;]/g, ' ') : '';
            }).join(',') + '\n';
        }
        res.header('Content-Type', 'text/csv');
        res.attachment('etudiants_selection.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
}
// Bulk import students from CSV
import csvParser from 'csv-parser';

export async function BulkImportEtudiants(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier reçu.' });
        }
        const results = [];
        const errors = [];
        const stream = fs.createReadStream(req.file.path).pipe(csvParser());
        stream.on('data', (row) => {
            // Validate row structure (nom, prenom, mail, etc.)
            if (!row.nom || !row.prenom || !row.mail) {
                errors.push({ row, error: 'Champs obligatoires manquants.' });
                return;
            }
            results.push(row);
        });
        stream.on('end', async () => {
            // Insert valid students
            const inserted = [];
            for (const student of results) {
                try {
                    const exists = await Etudiant.findOne({ mail: student.mail });
                    if (exists) {
                        errors.push({ student, error: 'Email déjà utilisé.' });
                        continue;
                    }
                    const newStudent = new Etudiant(student);
                    await newStudent.save();
                    inserted.push(newStudent);
                } catch (err) {
                    errors.push({ student, error: err.message });
                }
            }
            res.status(200).json({ inserted: inserted.length, errors });
        });
    } catch (error) {
        next(error);
    }
}

// Bulk export template as CSV
export async function BulkExportEtudiantsTemplate(req, res, next) {
    try {
        // Dynamically get all exportable fields from the schema
        const allFields = Object.keys(Etudiant.schema.paths).filter(f => !['_id', '__v'].includes(f));
        // Build CSV: header + empty row
        let csv = allFields.join(',') + '\n' + allFields.map(() => '').join(',') + '\n';
        res.header('Content-Type', 'text/csv');
        res.attachment('etudiants_template.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
}
import Etudiant from "../modeles/etudiants.js";
import { io } from "../index.js";
import fs from 'fs';
import path from 'path';

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

        // Matiere filter (multiple matieres supported, accent/case-insensitive)
        if (matiereParam) {
            let matieresArr = [];
            if (Array.isArray(matiereParam)) {
                matieresArr = matiereParam;
            } else if (typeof matiereParam === 'string') {
                matieresArr = matiereParam.split(',').map(m => m.trim()).filter(m => m);
            }
            // Normalize: lowercase, remove accents
            const normalize = s => s.toLowerCase();
            const normalizedMatieres = matieresArr.map(normalize);
            if (normalizedMatieres.length > 0) {
                filter.$expr = {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$matieres",
                                    as: "m",
                                    cond: {
                                        $in: [
                                            { $toLower: { $toString: "$$m" } },
                                            normalizedMatieres
                                        ]
                                    }
                                }
                            }
                        },
                        0
                    ]
                };
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

        try {
            const [data, total] = await Promise.all([
                queryBuilder.exec(),
                Etudiant.countDocuments(filter)
            ]);

            console.log('✅ Found', data.length, 'students, total:', total);
            if (data.length > 0) {
                console.log('📌 First student ID:', data[0].id, 'Last student ID:', data[data.length - 1].id);
            }

            res.status(200).json({ data, total, page, limit });
        } catch (mongoError) {
            console.error('❌ MongoDB error in GetAllEtudiants:', mongoError);
            res.status(500).json({ message: 'Erreur MongoDB lors du filtrage des étudiants', error: mongoError.message });
        }
    } catch (error) {
        console.error('❌ General error in GetAllEtudiants:', error);
        next(error);
    }
}
export async function GetEtudiantById(req, res, next) {
    try { 
        const etudiants = await Etudiant.findOne({id:req.params.id});
        
        // Add 500ms timeout for testing
        setTimeout(() => {
            res.status(200).json(etudiants);
        }, 500);
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
        
        // Parse matieres if it's a JSON string
        let parsedBody = { ...req.body };
        if (parsedBody.matieres && typeof parsedBody.matieres === 'string') {
            try {
                parsedBody.matieres = JSON.parse(parsedBody.matieres);
            } catch (error) {
                console.error('Error parsing matieres:', error);
                parsedBody.matieres = [];
            }
        }
        
        // Create new student with auto-generated ID and Moroccan fields
        const {
            nom, prenom, mail, cin, telephone, telephoneParent,
            adresse, ville, codePostal, pays = 'Maroc', nationalite = 'Marocaine',
            ...rest
        } = parsedBody;
        const studentData = {
            nom, prenom, mail, cin, telephone, telephoneParent,
            adresse, ville, codePostal, pays, nationalite,
            id: nextId,
            createdBy: userId, // Track who created this student
            ...rest
        };

        // Handle photo upload
        if (req.file) {
            studentData.photo = `/uploads/etudiants/${req.file.filename}`;
        }

        const newEtudiant = new Etudiant(studentData);
        const savedEtudiant = await newEtudiant.save();

        // Journal log: create
        try {
            const Journal = (await import('../modeles/journal.js')).default;
            await Journal.create({
                action: 'create',
                collection: 'etudiants',
                documentId: savedEtudiant.id,
                dataAfter: savedEtudiant,
                user: {
                    id: userId,
                    nom: req.user?.nom,
                    prenom: req.user?.prenom,
                    role: req.user?.role
                },
                timestamp: new Date()
            });
        } catch (err) {
            console.error('Journal log failed (create):', err);
        }
        
        // Handle photo file renaming for new students
        if (req.file && req.file.filename.startsWith('temp-')) {
            const uploadsDir = './uploads/etudiants/';
            const oldPath = path.join(uploadsDir, req.file.filename);
            const ext = path.extname(req.file.filename);
            const newFilename = `${savedEtudiant.id}-photo${ext}`;
            const newPath = path.join(uploadsDir, newFilename);
            
            try {
                // Rename the file
                await fs.promises.rename(oldPath, newPath);
                
                // Update the photo field in the database
                savedEtudiant.photo = `/uploads/etudiants/${newFilename}`;
                await savedEtudiant.save();
                
                console.log(`Renamed photo file from ${req.file.filename} to ${newFilename}`);
            } catch (renameError) {
                console.error('Error renaming photo file:', renameError);
                // Keep the temporary name if rename fails
            }
        }
        
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
                io.emit('studentCreated', {
                    student: savedEtudiant,
                    createdBy: {
                        id: userId,
                        nom: req.user?.nom,
                        prenom: req.user?.prenom
                    },
                    timestamp: new Date()
                });
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
        
        // Parse matieres if it's a JSON string
        let parsedBody = { ...req.body };
        if (parsedBody.matieres && typeof parsedBody.matieres === 'string') {
            try {
                parsedBody.matieres = JSON.parse(parsedBody.matieres);
            } catch (error) {
                console.error('Error parsing matieres:', error);
                parsedBody.matieres = [];
            }
        }
        
        // Add updatedBy to the update data
        const updateData = {
            ...parsedBody,
            updatedBy: userId
        };

        // Handle photo upload
        if (req.file) {
            updateData.photo = `/uploads/etudiants/${req.file.filename}`;
        }
        
        // Get previous data for journal
        const prevEtudiant = await Etudiant.findOne({id:req.params.id});
        const etudiant = await Etudiant.findOneAndUpdate(
            {id:req.params.id}, 
            updateData, 
            {new: true}
        );

        // Journal log: update
        if (etudiant) {
            try {
                const Journal = (await import('../modeles/journal.js')).default;
                await Journal.create({
                    action: 'update',
                    collection: 'etudiants',
                    documentId: etudiant.id,
                    dataBefore: prevEtudiant,
                    dataAfter: etudiant,
                    user: {
                        id: userId,
                        nom: req.user?.nom,
                        prenom: req.user?.prenom,
                        role: req.user?.role
                    },
                    timestamp: new Date()
                });
            } catch (err) {
                console.error('Journal log failed (update):', err);
            }
        }
        
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
                        io.emit('studentUpdated', {
                            student: etudiant,
                            updatedBy: {
                                id: userId,
                                nom: req.user?.nom,
                                prenom: req.user?.prenom
                            },
                            timestamp: new Date()
                        });
                        console.log('[Socket.io] Emitted studentUpdated event for student:', etudiant.id);
                }
        
        res.status(200).json(etudiant);
    } catch (error) {
        next(error);
    }
}
export async function DeleteEtudiant(req, res, next) {
    try {
        // Get previous data for journal
        const prevEtudiant = await Etudiant.findOne({id:req.params.id});
        const etudiant = await Etudiant.findOneAndDelete({id:req.params.id});

        // Journal log: delete
        if (prevEtudiant) {
            try {
                const Journal = (await import('../modeles/journal.js')).default;
                await Journal.create({
                    action: 'delete',
                    collection: 'etudiants',
                    documentId: req.params.id,
                    dataBefore: prevEtudiant,
                    user: {
                        id: req.user?.userId,
                        nom: req.user?.nom,
                        prenom: req.user?.prenom,
                        role: req.user?.role
                    },
                    timestamp: new Date()
                });
            } catch (err) {
                console.error('Journal log failed (delete):', err);
            }
        }
        
        // Emit Socket.io event for real-time updates
                if (etudiant) {
                        io.emit('studentDeleted', {
                            student: { id: req.params.id },
                            deletedBy: {
                                id: req.user?.userId,
                                nom: req.user?.nom,
                                prenom: req.user?.prenom
                            },
                            timestamp: new Date()
                        });
                        console.log('[Socket.io] Emitted studentDeleted event for student:', req.params.id);
                }
        
        res.status(200).json(etudiant);
    } catch (error) {
        next(error);
    }
}
