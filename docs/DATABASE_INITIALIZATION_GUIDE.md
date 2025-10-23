# 📊 Guide d'Initialisation de la Base de Données MongoDB

**Date**: 20 Octobre 2025  
**Problème**: Collections vides dans MongoDB Compass  
**Solution**: Script d'initialisation automatique

---

## 🎯 Problème

Lorsque vous ouvrez MongoDB Compass, vous voyez :
```
This collection has no data
It only takes a few seconds to import data from a JSON or CSV file
```

---

## ✅ Solution Automatique (Recommandée)

### Étape 1: Vérifier MongoDB

Assurez-vous que MongoDB est démarré :

```powershell
# Windows - Vérifier le service
Get-Service MongoDB

# Si MongoDB n'est pas démarré
net start MongoDB
```

### Étape 2: Exécuter le Script d'Initialisation

```powershell
cd "BACK END"
npm run db:seed:all
```

Ce script va automatiquement :
- ✅ Se connecter à MongoDB
- ✅ Nettoyer les collections existantes
- ✅ Insérer 20 étudiants de démonstration
- ✅ Créer 4 utilisateurs avec mots de passe hashés
- ✅ Afficher les identifiants de connexion

### Étape 3: Vérifier dans MongoDB Compass

1. Ouvrir MongoDB Compass
2. Se connecter à `mongodb://localhost:27017`
3. Sélectionner la base de données `etudiants`
4. Vérifier les collections :
   - ✅ `etudiants` (20 documents)
   - ✅ `users` (4 documents)

---

## 📋 Données Insérées

### Collection: etudiants (20 étudiants)

```json
{
  "id": 1,
  "nom": "Dupont",
  "prenom": "Jean",
  "mail": "jean.dupont@example.com",
  "photo": "https://i.pravatar.cc/150?img=1",
  "matieres": ["Mathématiques", "Physique", "Informatique"],
  "createdAt": "2024-09-15T10:30:00.000Z"
}
```

**Liste complète** : 20 étudiants avec des données variées

### Collection: users (4 utilisateurs)

#### 🔑 Administrateurs (2)

**1. Super Admin**
```
Email: admin@example.com
Password: admin123
Rôle: admin
```

**2. Pierre Martin**
```
Email: pierre.martin@example.com
Password: password123
Rôle: admin
```

#### 👤 Utilisateurs Standard (2)

**3. Test User**
```
Email: user@example.com
Password: user123
Rôle: user
```

**4. Marie Dupont**
```
Email: marie.dupont@example.com
Password: password123
Rôle: user
```

---

## 🔧 Solution Manuelle (Alternative)

Si vous préférez importer manuellement via MongoDB Compass :

### Méthode 1: Import JSON

1. Ouvrir MongoDB Compass
2. Sélectionner la base de données `etudiants`
3. Cliquer sur "CREATE COLLECTION" ou sélectionner une collection existante
4. Cliquer sur "ADD DATA" → "Import JSON or CSV file"
5. Sélectionner le fichier `BACK END/sample-data/etudiants.json`
6. Cliquer sur "Import"

### Méthode 2: mongoimport (CLI)

```bash
# Importer les étudiants
mongoimport --db etudiants --collection etudiants --file "BACK END/sample-data/etudiants.json" --jsonArray

# Note: Pour users, utilisez le script automatique car les mots de passe doivent être hashés
```

---

## 🚀 Utilisation après l'initialisation

### Tester la Connexion

**1. Démarrer le backend**
```powershell
cd "BACK END"
npm start
```

**2. Tester l'API**
```powershell
# Récupérer tous les étudiants
curl http://localhost:3000/api/etudiants

# Connexion en tant qu'admin
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**3. Tester le Frontend**
```powershell
cd FRONTEND
ng serve

# Ouvrir http://localhost:4200
# Se connecter avec admin@example.com / admin123
```

---

## 🔍 Vérification des Données

### Via MongoDB Compass

**Collection `etudiants`** :
- Nombre de documents : 20
- Champs : id, nom, prenom, mail, photo, matieres, createdAt

**Collection `users`** :
- Nombre de documents : 4
- Champs : nom, prenom, email, password (hashé), role, createdAt

### Via Node.js

```javascript
// Dans node (REPL)
import mongoose from 'mongoose';
import Etudiant from './modeles/etudiants.js';
import User from './modeles/user.js';

await mongoose.connect('mongodb://localhost:27017/etudiants');

// Compter les étudiants
const countEtudiants = await Etudiant.countDocuments();
console.log(`Étudiants: ${countEtudiants}`); // Devrait afficher 20

// Compter les users
const countUsers = await User.countDocuments();
console.log(`Users: ${countUsers}`); // Devrait afficher 4

// Lister les étudiants
const etudiants = await Etudiant.find().limit(5);
console.log(etudiants);
```

---

## ⚠️ Dépannage

### Problème : "Connection refused"

**Cause** : MongoDB n'est pas démarré

**Solution** :
```powershell
# Windows
net start MongoDB

# Ou vérifier le service
Get-Service MongoDB
```

### Problème : "Database already exists"

**Cause** : Données déjà présentes

**Solution** :
```powershell
# Le script nettoie automatiquement les collections
npm run db:seed:all

# Ou nettoyer manuellement dans Compass
```

### Problème : "Authentication failed"

**Cause** : Mots de passe non hashés ou incorrects

**Solution** :
```powershell
# Toujours utiliser le script pour les users
npm run db:seed:all

# Ne PAS importer users manuellement (mots de passe non hashés)
```

### Problème : "Module not found"

**Cause** : Dépendances manquantes

**Solution** :
```powershell
cd "BACK END"
npm install
```

---

## 📝 Scripts Disponibles

```powershell
# Initialiser toute la base de données (étudiants + users)
npm run db:seed:all

# Autres scripts utiles
npm run db:diagnose      # Diagnostiquer la base de données
npm run db:list          # Lister toutes les bases de données
npm run db:seed          # Seed étudiants seulement
npm run user:create      # Créer un utilisateur interactivement
```

---

## 🎉 Résultat Attendu

Après l'exécution du script, vous devriez voir :

```
🔌 Connexion à MongoDB...
✅ Connecté à MongoDB

🧹 Nettoyage des collections...
✅ Collections nettoyées

👨‍🎓 Insertion des étudiants...
✅ 20 étudiants insérés

👤 Création des utilisateurs...
✅ 4 utilisateurs créés

📋 COMPTES CRÉÉS:
=====================================

🔑 ADMINISTRATEURS:
  Email: admin@example.com
  Password: admin123
  Rôle: admin
  ---
  Email: pierre.martin@example.com
  Password: password123
  Rôle: admin
  ---

👤 UTILISATEURS:
  Email: user@example.com
  Password: user123
  Rôle: user
  ---
  Email: marie.dupont@example.com
  Password: password123
  Rôle: user
  ---

=====================================
✅ Base de données initialisée avec succès!

📊 Résumé:
   - 20 étudiants
   - 4 utilisateurs
   - 2 administrateurs
   - 2 utilisateurs standard

🚀 Vous pouvez maintenant démarrer l'application!

🔌 Déconnexion de MongoDB

✅ Script terminé avec succès!
```

---

## 📚 Fichiers Créés

```
BACK END/
├── sample-data/
│   ├── seed.js                 # Script d'initialisation
│   ├── etudiants.json          # 20 étudiants de test
│   └── users-template.json     # Template users (référence)
└── package.json                # Script npm ajouté
```

---

**Prochaines étapes** :
1. ✅ Exécuter `npm run db:seed:all`
2. ✅ Vérifier dans MongoDB Compass
3. ✅ Démarrer le backend
4. ✅ Tester l'application

**Votre base de données est maintenant prête ! 🚀**
