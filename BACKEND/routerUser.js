import { Router } from "express";
import {registerUser,loginUser,getAllUsers,updateUserProfile,changePassword,getPendingUsers,approveUser,rejectUser,getAllUsersManagement,updateUserById,deleteUserById,suspendUser,reactivateUser,getCurrentUser,googleSignUp,googleSignIn} from "./controler/controlerUser.js";

const routerUser = Router();

import { authentification, role } from "./middelware/authentification.js";

routerUser.post('/register', registerUser);
routerUser.post('/login', loginUser);
// Google Authentication routes
routerUser.post('/google-signup', googleSignUp);
routerUser.post('/google-signin', googleSignIn);
// Get current user (refresh)
routerUser.get('/me', authentification, getCurrentUser);
// Only admin can see all users
routerUser.get('/all', authentification, role('admin'), getAllUsers);
// Update own profile (authenticated users)
routerUser.put('/profile', authentification, updateUserProfile);
// Change password (authenticated users)
routerUser.put('/change-password', authentification, changePassword);

// Super-admin user management
routerUser.get('/management', authentification, role('super-admin'), getAllUsersManagement);
routerUser.put('/management/:id', authentification, role('super-admin'), updateUserById);
routerUser.delete('/management/:id', authentification, role('super-admin'), deleteUserById);
routerUser.put('/management/:id/suspend', authentification, role('super-admin'), suspendUser);
routerUser.put('/management/:id/reactivate', authentification, role('super-admin'), reactivateUser);

// Admin approval workflow (super-admin only)
routerUser.get('/pending', authentification, role('super-admin'), getPendingUsers);
routerUser.put('/:id/approve', authentification, role('super-admin'), approveUser);
routerUser.put('/:id/reject', authentification, role('super-admin'), rejectUser);

// Example: edit any profile (admin only), edit own profile (user)
// routerUser.put('/:id', authentification, role('admin', 'user'), (req, res, next) => {
//   if (req.user.role === 'admin' || req.user.userId === req.params.id) {
//     // allow edit
//     return updateUserProfile(req, res, next);
//   }
//   return res.status(403).json({ message: 'Forbidden: Cannot edit other profiles' });
// });

routerUser.get('/test', (req, res) => {
    res.json({ message: 'Router is working!' });
});

export default routerUser;