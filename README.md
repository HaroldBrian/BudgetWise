# BudgetWise Backend API

BudgetWise est une API backend robuste pour la gestion de budget personnel, développée avec Express.js, Sequelize ORM et MySQL.

## 🚀 Fonctionnalités

- **Authentification JWT** - Inscription et connexion sécurisées
- **Gestion des utilisateurs** - Profils utilisateur complets
- **Budgets mensuels** - Création et suivi des budgets par mois
- **Transactions** - Gestion des revenus et dépenses avec catégorisation
- **Alertes** - Système d'alertes basé sur des seuils personnalisables
- **Rapports** - Génération de rapports mensuels en PDF
- **API REST** - Interface RESTful complète et documentée

## 🛠️ Technologies

- **Backend**: Express.js (Node.js)
- **ORM**: Sequelize
- **Base de données**: MySQL
- **Tests**: Jest + Supertest
- **Linting**: ESLint
- **CI/CD**: GitHub Actions
- **Déploiement**: Render.com

## 📋 Prérequis

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm ou yarn

## ⚡ Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/budgetwise-backend.git
cd budgetwise-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos paramètres :
```env
NODE_ENV=development
PORT=3000

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=budgetwise_db
DB_USER=root
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
```

4. **Créer la base de données**
```bash
mysql -u root -p -e "CREATE DATABASE budgetwise_db;"
```

5. **Démarrer le serveur de développement**
```bash
npm run dev
```

L'API sera accessible sur `http://localhost:3000`

## 🗄️ Base de données

### Schéma des tables

#### Users
- `id` - Identifiant unique
- `name` - Nom de l'utilisateur
- `email` - Adresse email unique
- `password` - Mot de passe hashé
- `created_at` - Date d'inscription

#### Budgets
- `id` - Identifiant unique
- `user_id` - Référence utilisateur
- `month` - Mois (format YYYY-MM)
- `amount` - Montant du budget

#### Transactions
- `id` - Identifiant unique
- `user_id` - Référence utilisateur
- `type` - Type (income/expense)
- `amount` - Montant
- `description` - Description
- `category` - Catégorie
- `date` - Date de transaction
- `tags` - Tags (CSV)
- `is_recurring` - Transaction récurrente

#### Alerts
- `id` - Identifiant unique
- `transaction_id` - Référence transaction
- `threshold` - Seuil d'alerte
- `active` - Statut actif/inactif

#### Reports
- `id` - Identifiant unique
- `user_id` - Référence utilisateur
- `month` - Mois du rapport
- `pdf_url` - URL du fichier PDF

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Users
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Mise à jour profil
- `PUT /api/users/password` - Changement mot de passe
- `DELETE /api/users/account` - Suppression compte

### Budgets
- `GET /api/budgets` - Liste des budgets
- `GET /api/budgets/:month` - Budget par mois
- `POST /api/budgets` - Créer/mettre à jour budget
- `DELETE /api/budgets/:month` - Supprimer budget

### Transactions
- `GET /api/transactions` - Liste des transactions
- `GET /api/transactions/:id` - Transaction par ID
- `POST /api/transactions` - Créer transaction
- `PUT /api/transactions/:id` - Mettre à jour transaction
- `DELETE /api/transactions/:id` - Supprimer transaction

### Alerts
- `GET /api/alerts` - Liste des alertes
- `GET /api/alerts/:id` - Alerte par ID
- `POST /api/alerts` - Créer alerte
- `PUT /api/alerts/:id` - Mettre à jour alerte
- `DELETE /api/alerts/:id` - Supprimer alerte

### Reports
- `GET /api/reports` - Liste des rapports
- `GET /api/reports/:month` - Rapport par mois
- `POST /api/reports` - Créer rapport
- `PUT /api/reports/:month` - Mettre à jour rapport
- `DELETE /api/reports/:month` - Supprimer rapport

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Génération du coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## 🚀 Déploiement

### Render.com (Recommandé)

1. Connecter votre repository GitHub à Render
2. Configurer les variables d'environnement
3. Le déploiement se fait automatiquement via GitHub Actions

### Variables d'environnement pour la production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=budgetwise_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_production_jwt_secret
```

## 📁 Structure du projet

```
budgetwise-backend/
├── src/
│   ├── config/          # Configuration base de données
│   ├── middleware/      # Middleware personnalisés
│   ├── models/          # Modèles Sequelize
│   ├── routes/          # Routes API
│   └── utils/           # Utilitaires
├── __tests__/           # Tests
├── logs/                # Fichiers de logs
├── .github/workflows/   # GitHub Actions
├── server.js           # Point d'entrée
└── package.json
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub ou contactez l'équipe de développement.

---

Développé avec ❤️ par l'équipe BudgetWise