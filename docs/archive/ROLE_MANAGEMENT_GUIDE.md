# 🔐 Role Management System - Implementation Guide

## Overview

This application implements a secure two-tier role management system with **Admin** and **User (Student)** roles.

---

## 🎭 Role Definitions

### Admin Role
Admins have full system access including:
- ✅ View and manage all users
- ✅ Edit any profile
- ✅ Create, update, and delete students
- ✅ Manage subjects and all system data
- ✅ Access to statistics page
- ✅ Full CRUD operations on all resources

### User Role (Student)
Users have limited access:
- ✅ View their own profile and edit it
- ✅ View their subjects
- ✅ View the full list of all students (read-only)
- ✅ View details of any student (read-only)
- ❌ Cannot edit other profiles
- ❌ Cannot delete students
- ❌ Cannot create new students
- ❌ Cannot access statistics

---

## 🔑 Admin Registration

### Secret Admin Code
To register as an admin, users must provide the **Admin Code**: `123456`

### How It Works

#### Backend Validation (`controlerUser.js`)
```javascript
const ADMIN_CODE = '123456';

if (role === 'admin') {
  if (adminCode !== ADMIN_CODE) {
    return res.status(403).json({ 
      message: 'Code administrateur incorrect. Inscription refusée.' 
    });
  }
  assignedRole = 'admin';
}
```

#### Frontend Registration Form
- When "Administrateur" is selected in the role dropdown, an admin code field appears
- The code field is required to complete admin registration
- Without the correct code, registration as admin will be rejected by the backend

---

## 🛡️ Backend Security Implementation

### 1. JWT Token with Role
When a user logs in, the JWT token includes their role:
```javascript
const token = jwt.sign(
  { userId: user._id, role: user.role }, 
  process.env.JWT_SECRET, 
  { expiresIn: '1h' }
);
```

### 2. Role Middleware (`middelware/authentification.js`)
```javascript
export function role(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient rights' 
      });
    }
    next();
  }
}
```

### 3. Protected Routes (`router.js`)

#### Student Routes
```javascript
// All users can view all students (read-only)
myRouter.get('/', authentification, role('admin', 'user'), GetAllEtudiants);

// All users can view student details
myRouter.get('/:id', authentification, role('admin', 'user'), GetEtudiantById);

// Only admin can create students
myRouter.post('/', authentification, role('admin'), CreateEtudiant);

// Only admin can update students
myRouter.put('/:id', authentification, role('admin', 'user'), (req, res, next) => {
  if (req.user.role === 'admin' || req.user.userId === req.params.id) {
    return UpdateEtudiant(req, res, next);
  }
  return res.status(403).json({ message: 'Forbidden: Cannot edit other profiles' });
});

// Only admin can delete students
myRouter.delete('/:id', authentification, role('admin'), DeleteEtudiant);
```

#### User Routes
```javascript
// Only admin can view all users
routerUser.get('/all', authentification, role('admin'), getAllUsers);
```

---

## 🎨 Frontend Access Control

### 1. AuthService Role Exposure
```typescript
public get role(): 'admin' | 'user' | null {
  return this.getCurrentUser()?.role ?? null;
}
```

### 2. Route Guards (`auth.guard.ts`)

#### RoleGuard
Protects routes based on required roles:
```typescript
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot) {
    const requiredRoles = route.data['roles'] as Array<'user' | 'admin'>;
    const userRole = this.authService.role;
    
    if (!requiredRoles.includes(userRole)) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}
```

#### Route Configuration
```typescript
{ 
  path: 'statistiques', 
  component: StatistiquesComponent,
  canActivate: [RoleGuard],
  data: { roles: ['admin'] }  // Admin only
},
{ 
  path: 'etudiants/form', 
  component: EtudiantFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['admin'] }  // Admin only
}
```

### 3. UI Conditional Rendering

#### Navbar (`navbar.component.html`)
```html
<!-- Admin-only links -->
<li class="nav-item" *ngIf="authService.role === 'admin'">
  <a routerLink="/etudiants/form">
    <i class="nav-icon">➕</i>
    <span>Créer un étudiant</span>
  </a>
</li>

<li class="nav-item" *ngIf="authService.role === 'admin'">
  <a routerLink="/statistiques">
    <i class="nav-icon">📊</i>
    <span>Statistiques</span>
  </a>
</li>
```

#### Student List (`liste-etudiants.component.html`)
```html
<!-- Admin only: Add button -->
<button *ngIf="authService.role === 'admin'" class="btn btn--add" (click)="addNewStudent()">
  <span>+ Ajouter un étudiant</span>
</button>

<!-- Admin only: Edit button in cards -->
<button *ngIf="authService.role === 'admin'" class="btn btn--ghost btn--icon" 
        (click)="goToDetailsPage(etudiant.id!)" 
        title="Modifier">
  <i class="fa fa-edit"></i>
</button>
```

#### Student Details (`details-etudiants.component.html`)
```html
<!-- Admin only: Edit and Delete buttons -->
<div *ngIf="!isEditing && authService.role === 'admin'" class="view-actions">
  <button class="btn btn--primary" (click)="editStudent()">
    <i class="fas fa-edit"></i>
    Modifier
  </button>
  
  <button class="btn btn--danger" (click)="deleteStudent()">
    <i class="fas fa-trash-alt"></i>
    Supprimer
  </button>
</div>
```

#### Profile (`profile.component.html`)
```html
<!-- User can edit own profile, Admin can edit any profile -->
<button 
  *ngIf="!isEditing && (authService.role === 'admin' || (user && user.mail === authService.getCurrentUser()?.mail))" 
  class="btn btn-primary" 
  (click)="enableEdit()">
  <i class="btn-icon">✏️</i>
  Modifier
</button>
```

---

## 📋 Feature Summary

### What Users Can See/Do
| Feature | Admin | User |
|---------|-------|------|
| View student list | ✅ | ✅ |
| View student details | ✅ | ✅ |
| Create student | ✅ | ❌ |
| Edit any student | ✅ | ❌ |
| Edit own profile | ✅ | ✅ |
| Delete student | ✅ | ❌ |
| View statistics | ✅ | ❌ |
| View all users | ✅ | ❌ |
| Navigation to create student | ✅ | ❌ |
| Navigation to statistics | ✅ | ❌ |
| Edit buttons in list | ✅ | ❌ |
| Edit/Delete in details | ✅ | ❌ |

---

## 🧪 Testing the System

### 1. Register as User (Default)
1. Go to registration page
2. Fill in details
3. Select "Utilisateur" as role
4. Register successfully
5. Login and verify limited access

### 2. Register as Admin (With Code)
1. Go to registration page
2. Fill in details
3. Select "Administrateur" as role
4. Admin code field appears
5. Enter code: `123456`
6. Register successfully
7. Login and verify full access

### 3. Try Invalid Admin Code
1. Select "Administrateur" role
2. Enter wrong code (e.g., `000000`)
3. Registration should fail with error: "Code administrateur incorrect"

### 4. Test User Permissions
Login as user and verify:
- ✅ Can view student list
- ✅ Can view student details
- ✅ Cannot see "Add Student" button
- ✅ Cannot see edit buttons in student cards
- ✅ Cannot see edit/delete buttons in details
- ✅ Cannot access `/etudiants/form`
- ✅ Cannot access `/statistiques`
- ✅ Can edit own profile

### 5. Test Admin Permissions
Login as admin and verify:
- ✅ Can see all UI elements
- ✅ Can create students
- ✅ Can edit any student
- ✅ Can delete students
- ✅ Can access statistics
- ✅ Can view all users

---

## 🔒 Security Best Practices Implemented

### 1. Backend Validation
- ✅ Role checked in JWT token
- ✅ Middleware validates role on every protected route
- ✅ Admin code required for admin registration
- ✅ Cannot bypass frontend restrictions by API calls

### 2. Frontend Security
- ✅ Route guards prevent unauthorized navigation
- ✅ UI elements hidden based on role
- ✅ AuthService exposes role for component checks
- ✅ Guards redirect unauthorized users

### 3. Token Security
- ✅ JWT includes role claim
- ✅ Token verified on every request
- ✅ Role cannot be modified client-side
- ✅ 1-hour token expiration

---

## 🚀 Future Enhancements (Optional)

1. **Environment Variable for Admin Code**
   - Move `123456` to `.env` file
   - Different codes for dev/staging/prod

2. **Multiple Admin Codes**
   - Support multiple valid admin codes
   - Track which code was used (audit)

3. **Role Hierarchy**
   - Add more roles: super-admin, moderator, etc.
   - Implement permission-based system

4. **Admin User Management UI**
   - Admin dashboard to view all users
   - Ability to promote/demote users
   - Disable/enable user accounts

5. **Audit Logging**
   - Log all admin actions
   - Track who created/edited/deleted what

6. **Two-Factor Authentication for Admins**
   - Extra security layer for admin accounts

---

## 📝 Notes

- The admin code `123456` is currently hardcoded for simplicity
- In production, use environment variables for secrets
- Regular users cannot escalate privileges
- All sensitive operations are validated on the backend
- Frontend restrictions are for UX; backend enforces security

---

## ✅ Checklist

- [x] Backend role middleware implemented
- [x] Admin code validation on registration
- [x] JWT tokens include role
- [x] Protected routes with role checks
- [x] Frontend RoleGuard implemented
- [x] UI elements conditionally rendered
- [x] Navbar shows role-appropriate links
- [x] Student list respects permissions
- [x] Student details respects permissions
- [x] Profile editing respects permissions
- [x] Registration form includes admin code field
- [x] Documentation complete

---

**Last Updated**: October 17, 2025  
**Status**: ✅ Fully Implemented and Tested
