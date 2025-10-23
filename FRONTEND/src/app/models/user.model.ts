// Interfaces pour les sous-documents
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en' | 'ar';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  itemsPerPage: number;
}

export interface UserContact {
  telephone?: string;
  telephoneMobile?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

export interface UserStats {
  totalLogins: number;
  studentsCreated: number;
  studentsModified: number;
}

export interface User {
  _id?: string;
  
  // Informations de base
  nom: string;
  prenom: string;
  mail: string;
  password?: string; // Optional pour les réponses
  
  // Rôle et permissions
  role: 'user' | 'admin' | 'moderator' | 'teacher' | 'student' | 'super-admin';
  permissions?: string[];
  
  // Account status for admin approval
  accountStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvedBy?: string;
  approvalDate?: Date | string;
  rejectionReason?: string;
  
  // Informations personnelles
  dateNaissance?: Date | string;
  genre?: 'M' | 'F' | 'Autre' | 'Non spécifié';
  photo?: string;
  bio?: string;
  
  // Informations de contact
  contact?: UserContact;
  
  // Préférences
  preferences?: UserPreferences;
  
  // Statut du compte
  isActive?: boolean;
  isVerified?: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date | string;
  
  // Informations de connexion
  lastLogin?: Date | string;
  loginAttempts?: number;
  lockUntil?: Date | string;
  
  // Dashboard
  stats?: UserStats;
  
  // Virtuels
  nomComplet?: string;
  age?: number;
  isLocked?: boolean;
  
  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LoginRequest {
  mail: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  mail: string;
  password: string;
  role?: 'user' | 'admin' | 'moderator' | 'teacher' | 'student';
  adminCode?: string;
  
  // Informations optionnelles à l'inscription
  dateNaissance?: Date | string;
  genre?: 'M' | 'F' | 'Autre' | 'Non spécifié';
  telephone?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  dateNaissance?: Date | string;
  genre?: 'M' | 'F' | 'Autre' | 'Non spécifié';
  photo?: string;
  bio?: string;
  contact?: UserContact;
  preferences?: UserPreferences;
}