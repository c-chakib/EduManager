import {Router} from "express";
import {GetAllEtudiants, GetEtudiantById, CreateEtudiant, UpdateEtudiant, DeleteEtudiant} from './controler/controler.js';
import {GetAllMatieres, GetAllMatieresDetails, GetMatiereById, CreateMatiere, UpdateMatiere, DeleteMatiere} from './controler/controlerMatieres.js';
import { authentification, role } from "./middelware/authentification.js";

const myRouter = Router();

// Middleware to conditionally apply authentication (skip for demo mode)
const conditionalAuth = (req, res, next) => {
    // Allow demo mode without authentication
    if (req.query.isDemo === 'true') {
        console.log('Demo mode detected - skipping authentication');
        return next();
    }
    // Otherwise require authentication
    return authentification(req, res, next);
};

// Routes pour les étudiants

// Matières routes - public access for list (needed for filtering)
myRouter.get('/matieres/list', GetAllMatieres); // Simple list of names
myRouter.get('/matieres/details', authentification, role('admin'), GetAllMatieresDetails); // Full details (admin only)
myRouter.get('/matieres/:id', authentification, role('admin'), GetMatiereById);
myRouter.post('/matieres', authentification, role('admin'), CreateMatiere);
myRouter.put('/matieres/:id', authentification, role('admin'), UpdateMatiere);
myRouter.delete('/matieres/:id', authentification, role('admin'), DeleteMatiere);

// All users can view all students (read-only), or public demo access
// Note: super-admin bypasses role check in middleware
myRouter.get('/', conditionalAuth, role('admin', 'user'), GetAllEtudiants);

// Only admin can view any student by id, users can view their own profile
// Note: super-admin bypasses role check in middleware
myRouter.get('/:id', authentification, role('admin', 'user'), GetEtudiantById);

// Only admin can create students
// Note: super-admin bypasses role check in middleware
myRouter.post('/', authentification, role('admin'), CreateEtudiant);

// Only admin can update any student, users can update their own profile
// Note: super-admin bypasses role check in middleware
myRouter.put('/:id', authentification, role('admin', 'user'), (req, res, next) => {
	if (req.user.role === 'admin' || req.user.role === 'super-admin' || req.user.userId === req.params.id) {
		return UpdateEtudiant(req, res, next);
	}
	return res.status(403).json({ message: 'Forbidden: Cannot edit other profiles' });
});

// Only admin can delete students
// Note: super-admin bypasses role check in middleware
myRouter.delete('/:id', authentification, role('admin'), DeleteEtudiant);

export default myRouter;