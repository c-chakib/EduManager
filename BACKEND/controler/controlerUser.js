import User from "../modeles/user.js";
import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { io } from "../index.js"; 

export async function registerUser(req, res, next) {
  const { nom, prenom, mail, password, role = 'user', adminCode, cin, telephone, telephoneMobile, adresse, ville, codePostal, pays = 'Maroc' } = req.body;
  
  // Admin registration requires special code
  const ADMIN_CODE = '123456';
  let assignedRole = 'user';
  
  if (role === 'admin') {
    if (adminCode !== ADMIN_CODE) {
      return res.status(403).json({ 
        message: 'Code administrateur incorrect. Inscription refusée.' 
      });
    }
    assignedRole = 'admin';
  }
  
  // ALL new registrations require super-admin approval
  const accountStatus = 'pending';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ mail });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Un compte avec cette adresse email existe déjà.' 
      });
    }

    const contact = { cin, telephone, telephoneMobile, adresse, ville, codePostal, pays };
    const newUser = new User({ 
      nom, prenom, mail, password: hashedPassword, 
      role: assignedRole, 
      accountStatus,
      contact 
    });
    await newUser.save();
    
    // Emit Socket.io event for real-time updates (for admin notifications)
    io.emit('userCreated', {
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        mail: newUser.mail,
        role: newUser.role,
        accountStatus: newUser.accountStatus
      },
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userCreated event for user:', newUser._id);
    
    // All accounts are pending approval
    return res.status(201).json({ 
      message: assignedRole === 'admin' 
        ? 'Demande d\'administrateur enregistrée. En attente d\'approbation par le super-administrateur.'
        : 'Votre compte a été créé avec succès. En attente d\'approbation par l\'administrateur.',
      user: { ...newUser.toObject(), password: undefined },
      requiresApproval: true
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  const { mail, password } = req.body;
  try {
    const user = await User.findOne({ mail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check account status
    if (user.accountStatus === 'pending') {
      return res.status(403).json({ 
        message: 'Votre compte est en attente d\'approbation par l\'administrateur.' 
      });
    }
    if (user.accountStatus === 'rejected') {
      return res.status(403).json({ 
        message: `Votre demande de compte a été refusée. ${user.rejectionReason || ''}` 
      });
    }
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ 
        message: 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    const token = jwt.sign({ userId: user._id, role:user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    next(error);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const userId = req.user.userId; // From authentication middleware
    const { 
      nom, 
      prenom, 
      mail, 
      cin, 
      telephone, 
      telephoneMobile, 
      adresse, 
      ville, 
      codePostal, 
      pays = 'Maroc',
      // Additional profile fields
      bio,
      dateNaissance,
      genre,
      preferences
    } = req.body;

    // Get current user to check if email is actually changing
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Only check for duplicate email if it's being changed
    if (mail && mail !== currentUser.mail) {
      const existingUser = await User.findOne({ mail });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Cette adresse email est déjà utilisée' 
        });
      }
    }

    // Build update object with only provided fields to avoid overwriting with undefined
    const update = {};
    if (typeof nom !== 'undefined') update.nom = nom;
    if (typeof prenom !== 'undefined') update.prenom = prenom;
    if (typeof mail !== 'undefined') update.mail = mail;
    if (typeof bio !== 'undefined') update.bio = bio;
    if (typeof dateNaissance !== 'undefined') update.dateNaissance = dateNaissance;
    if (typeof genre !== 'undefined') update.genre = genre;

    // Contact subdocument
    const contact = {};
    if (typeof cin !== 'undefined') contact.cin = cin;
    if (typeof telephone !== 'undefined') contact.telephone = telephone;
    if (typeof telephoneMobile !== 'undefined') contact.telephoneMobile = telephoneMobile;
    if (typeof adresse !== 'undefined') contact.adresse = adresse;
    if (typeof ville !== 'undefined') contact.ville = ville;
    if (typeof codePostal !== 'undefined') contact.codePostal = codePostal;
    if (typeof pays !== 'undefined') contact.pays = pays;
    if (Object.keys(contact).length > 0) update.contact = contact;

    // Preferences subdocument
    if (typeof preferences !== 'undefined') {
      update.preferences = preferences;
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true, runValidators: true }
    ).select('-password'); // Don't return password

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.status(200).json({ 
      success: true,
      data: updatedUser,
      message: 'Profil mis à jour avec succès' 
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

// Get current user (refresh profile data)
export async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// Get all users with filtering (super-admin only)
export async function getAllUsersManagement(req, res, next) {
  try {
    const { status, role, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = {};

    // Filter by account status
    if (status) {
      filter.accountStatus = status;
    }

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { mail: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), sortBy, sortOrder }
    });
  } catch (error) {
    next(error);
  }
}

// Update any user (super-admin only)
export async function updateUserById(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow password changes through this endpoint
    delete updateData.password;

    // Don't allow changing super-admin role unless you are super-admin
    const targetUser = await User.findById(id);
    if (targetUser?.role === 'super-admin' && req.user?.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier un super-administrateur'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Emit Socket.io event for real-time updates
    io.emit('userUpdated', {
      user: {
        id: updatedUser._id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        mail: updatedUser.mail,
        role: updatedUser.role
      },
      updatedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      changes: updateData,
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userUpdated event for user:', updatedUser._id);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
}

// Delete user (super-admin only)
export async function deleteUserById(req, res, next) {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Prevent deleting super-admin
    if (user.role === 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer un super-administrateur'
      });
    }

    // Prevent self-deletion
    if (id === req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await User.findByIdAndDelete(id);

    // Emit Socket.io event for real-time updates
    io.emit('userDeleted', {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role
      },
      deletedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userDeleted event for user:', user._id);

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.user.userId; // From authentication middleware
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe sont requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    next(error);
  }
}

// Get all pending admin requests (super-admin only)
export async function getPendingUsers(req, res, next) {
  try {
    const pendingUsers = await User.find({ accountStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    next(error);
  }
}

// Approve a pending admin request (super-admin only)
export async function approveUser(req, res, next) {
  try {
    const { id } = req.params;
    const approverId = req.user.userId;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    if (user.accountStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur n\'est pas en attente d\'approbation'
      });
    }
    
    user.accountStatus = 'approved';
    user.approvedBy = approverId;
    user.approvalDate = new Date();
    // Audit log
    user.auditLog = user.auditLog || [];
    user.auditLog.push({ action: 'approve', by: approverId, reason: 'Admin approval' });
    await user.save();

    // Emit Socket.io event for real-time updates
    io.emit('userApproved', {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        accountStatus: user.accountStatus
      },
      approvedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userApproved event for user:', user._id);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur approuvé avec succès',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

// Reject a pending admin request (super-admin only)
export async function rejectUser(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    if (user.accountStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur n\'est pas en attente d\'approbation'
      });
    }
    
    user.accountStatus = 'rejected';
    user.rejectionReason = reason || 'Non spécifié';
    user.rejectedBy = req.user.userId;
    user.rejectionDate = new Date();
    // Audit log
    user.auditLog = user.auditLog || [];
    user.auditLog.push({ action: 'reject', by: req.user.userId, reason });
    await user.save();

    // Emit Socket.io event for real-time updates
    io.emit('userRejected', {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        accountStatus: user.accountStatus
      },
      rejectedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      reason: reason || 'Non spécifié',
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userRejected event for user:', user._id);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur rejeté',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

// Suspend user (super-admin only)
export async function suspendUser(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    if (user.role === 'super-admin') {
      return res.status(403).json({ success: false, message: 'Impossible de suspendre un super-administrateur' });
    }
    user.accountStatus = 'suspended';
    user.auditLog = user.auditLog || [];
    user.auditLog.push({ action: 'suspend', by: req.user.userId, reason });
    await user.save();

    // Emit Socket.io event for real-time updates
    io.emit('userSuspended', {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        accountStatus: user.accountStatus
      },
      suspendedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      reason: reason || 'Non spécifié',
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userSuspended event for user:', user._id);

    res.status(200).json({ success: true, message: 'Utilisateur suspendu', data: user });
  } catch (error) {
    next(error);
  }
}

// Reactivate user (super-admin only)
export async function reactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    user.accountStatus = 'approved';
    user.auditLog = user.auditLog || [];
    user.auditLog.push({ action: 'reactivate', by: req.user.userId });
    await user.save();

    // Emit Socket.io event for real-time updates
    io.emit('userReactivated', {
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        accountStatus: user.accountStatus
      },
      reactivatedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      timestamp: new Date()
    });
    console.log('[Socket.io] Emitted userReactivated event for user:', user._id);

    res.status(200).json({ success: true, message: 'Utilisateur réactivé', data: user });
  } catch (error) {
    next(error);
  }
}

// Google Authentication Functions
export async function googleSignUp(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Token Google manquant' });
    }

    // Verify Google idToken and extract user info
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({ message: 'Token Google invalide' });
    }
    const payload = ticket.getPayload();
    const googleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      verified_email: payload.email_verified
    };

    // Check if user already exists
    const existingUser = await User.findOne({ mail: googleUser.email });
    if (existingUser) {
      return res.status(409).json({
        message: 'Un compte avec cette adresse email existe déjà.'
      });
    }

    // Create new user with Google data
    // Ensure nom and prenom are set, fallback to name if missing
    const nom = googleUser.family_name || googleUser.name || 'Google';
    const prenom = googleUser.given_name || googleUser.name || 'User';
    const newUser = new User({
      nom,
      prenom,
      mail: googleUser.email,
      password: '', // No password for Google users
      role: 'user',
      accountStatus: 'pending', // Still requires approval
      googleId: googleUser.id,
      profilePicture: googleUser.picture,
      isGoogleUser: true
    });

    await newUser.save();

    // Emit Socket.io event
    io.emit('userCreated', {
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        mail: newUser.mail,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        isGoogleUser: true
      },
      timestamp: new Date()
    });

    res.status(201).json({
      message: 'Compte Google créé avec succès. En attente d\'approbation.',
      pendingApproval: true,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        mail: newUser.mail,
        role: newUser.role,
        accountStatus: newUser.accountStatus
      }
    });

  } catch (error) {
    console.error('Google signup error:', error);
    next(error);
  }
}

export async function googleSignIn(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Token Google manquant' });
    }

    // Verify Google idToken and extract user info
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({ message: 'Token Google invalide' });
    }
    const payload = ticket.getPayload();
    const googleUser = {
      id: payload.sub,
      email: payload.email
    };

    // Find user by Google ID first
    let user = await User.findOne({ googleId: googleUser.id });
    
    if (!user) {
      // If not found by Google ID, try to find by email
      user = await User.findOne({ mail: googleUser.email });
      
      if (user) {
        // User exists with this email - check if it's approved
        if (user.accountStatus === 'approved' || user.accountStatus === 'active') {
          // Link the approved user with Google
          user.googleId = googleUser.id;
          user.isGoogleUser = true;
          user.profilePicture = payload.picture || user.profilePicture;
          await user.save();
          console.log('Linked existing approved user with Google account:', user.mail);
        } else {
          // User exists but is not approved - don't allow Google login
          return res.status(403).json({
            message: `Votre compte avec cette adresse email n'est pas approuvé. ${user.rejectionReason || 'Contactez un administrateur.'}`
          });
        }
      } else {
        // Create new user with Google profile info
        const nom = payload.family_name || payload.name || 'Google';
        const prenom = payload.given_name || payload.name || 'User';
        const newUser = new User({
          nom,
          prenom,
          mail: googleUser.email,
          password: '', // No password for Google users
          role: 'user',
          accountStatus: 'pending', // Or 'active' if you want instant access
          googleId: googleUser.id,
          profilePicture: payload.picture,
          isGoogleUser: true
        });
        await newUser.save();
        user = newUser;
        // Optionally emit Socket.io event for new user
        io.emit('userCreated', {
          user: {
            id: user._id,
            nom: user.nom,
            prenom: user.prenom,
            mail: user.mail,
            role: user.role,
            accountStatus: user.accountStatus
          },
          timestamp: new Date()
        });
      }
    }

    // Check account status
    if (user.accountStatus === 'pending') {
      return res.status(403).json({
        message: 'Votre compte est en attente d\'approbation par un administrateur.'
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        message: 'Votre compte a été suspendu. Contactez un administrateur.'
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Connexion Google réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        accountStatus: user.accountStatus,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google signin error:', error);
    next(error);
  }
}