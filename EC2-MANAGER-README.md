# 🚀 EC2 Instance Manager

Application web moderne pour gérer vos instances EC2 AWS. Interface intuitive permettant de démarrer, arrêter et surveiller vos instances EC2 en temps réel.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![AWS SDK](https://img.shields.io/badge/AWS_SDK-v2-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Fonctionnalités

### 🎯 Gestion des Instances
- **Visualisation en temps réel** - Tableau de bord avec toutes vos instances EC2
- **Contrôles d'alimentation** - Démarrer, arrêter et redémarrer les instances
- **Statistiques** - Vue d'ensemble du nombre d'instances par état
- **Filtres avancés** - Filtrer par état et rechercher par nom/ID
- **Détails complets** - Informations détaillées pour chaque instance

### 🎨 Interface Utilisateur
- **Design moderne** - Interface inspirée d'AWS avec couleurs officielles
- **Responsive** - Fonctionne sur desktop, tablette et mobile
- **Temps réel** - Actualisation automatique toutes les 30 secondes
- **Notifications** - Toasts pour tous les événements importants
- **États visuels** - Indicateurs clairs pour chaque statut d'instance

## 📋 Prérequis

- **Node.js** 14+ (recommandé: 18+)
- **Compte AWS** avec accès EC2
- **Credentials AWS** avec les permissions appropriées

### Permissions AWS Requises

Votre utilisateur IAM doit avoir ces permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd ec2-instance-manager
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration AWS

Créez un fichier `.env` à la racine du projet:

```bash
cp .env.example .env
```

Éditez `.env` et ajoutez vos credentials AWS:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=votre_access_key_id
AWS_SECRET_ACCESS_KEY=votre_secret_access_key
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANT:** Ne partagez JAMAIS votre fichier `.env` ou vos credentials AWS!

### 4. Démarrer l'application

#### Mode développement
```bash
npm run dev
```

#### Mode production
```bash
npm start
```

L'application sera accessible sur: `http://localhost:3000`

## 📁 Structure du Projet

```
ec2-instance-manager/
├── public/                 # Frontend files
│   ├── index.html         # Interface HTML principale
│   ├── styles.css         # Styles CSS
│   └── app.js             # JavaScript frontend
├── server.js              # Serveur Express + API
├── package.json           # Dépendances npm
├── .env.example          # Template de configuration
├── .gitignore            # Fichiers à ignorer par Git
└── README.md             # Documentation
```

## 🔌 API Endpoints

### Santé de l'API
```
GET /api/health
```
Vérifie que l'API est opérationnelle.

### Lister les instances
```
GET /api/instances
```
Retourne toutes les instances EC2 du compte.

### Détails d'une instance
```
GET /api/instances/:instanceId
```
Retourne les détails complets d'une instance spécifique.

### Démarrer une instance
```
POST /api/instances/:instanceId/start
```
Démarre une instance EC2 arrêtée.

### Arrêter une instance
```
POST /api/instances/:instanceId/stop
```
Arrête une instance EC2 en cours d'exécution.

### Redémarrer une instance
```
POST /api/instances/:instanceId/reboot
```
Redémarre une instance EC2.

## 🎨 Captures d'écran

### Tableau de bord
![Dashboard](https://via.placeholder.com/800x400?text=EC2+Manager+Dashboard)

### Détails d'instance
![Details](https://via.placeholder.com/800x400?text=Instance+Details)

## 🔧 Configuration Avancée

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `AWS_REGION` | Région AWS à utiliser | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Access Key ID AWS | - |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key AWS | - |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement | `development` |

### Personnalisation des couleurs

Les couleurs sont définies dans `public/styles.css`:

```css
:root {
  --aws-orange: #FF9900;
  --aws-dark: #232F3E;
  --status-running: #10b981;
  --status-stopped: #ef4444;
  /* ... */
}
```

## 🛡️ Sécurité

### Bonnes Pratiques

1. **Credentials AWS**
   - Utilisez un utilisateur IAM dédié avec permissions minimales
   - Ne stockez jamais les credentials dans le code
   - Utilisez des variables d'environnement

2. **Réseau**
   - Déployez derrière un reverse proxy (nginx, Apache)
   - Utilisez HTTPS en production
   - Limitez l'accès par IP si possible

3. **Application**
   - Gardez les dépendances à jour: `npm audit`
   - Utilisez des secrets forts
   - Activez les logs pour l'audit

### IAM Role (Recommandé pour EC2)

Si vous déployez cette application sur EC2, utilisez un IAM Role au lieu de credentials:

1. Créez un rôle IAM avec les permissions nécessaires
2. Attachez le rôle à votre instance EC2
3. Supprimez `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` du `.env`

## 🚀 Déploiement

### Sur une instance EC2

```bash
# Cloner et installer
git clone <repository-url>
cd ec2-instance-manager
npm install

# Configuration
cp .env.example .env
nano .env  # Éditer les credentials

# Installer PM2 pour la gestion des processus
npm install -g pm2

# Démarrer avec PM2
pm2 start server.js --name ec2-manager
pm2 save
pm2 startup
```

### Avec Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t ec2-manager .
docker run -p 3000:3000 --env-file .env ec2-manager
```

### Avec Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Dépannage

### Erreur: "Unable to locate credentials"
- Vérifiez que votre fichier `.env` existe et contient les bonnes credentials
- Assurez-vous que les variables d'environnement sont chargées

### Erreur: "UnauthorizedOperation"
- Vérifiez les permissions IAM de votre utilisateur
- Assurez-vous d'avoir les permissions EC2 nécessaires

### Les instances ne s'affichent pas
- Vérifiez la région configurée dans `.env`
- Assurez-vous d'avoir des instances EC2 dans cette région
- Consultez les logs du serveur: `npm start`

### Port déjà utilisé
```bash
# Changer le port dans .env
PORT=3001
```

## 📊 Monitoring

### Logs

```bash
# Voir les logs en temps réel
npm start

# Avec PM2
pm2 logs ec2-manager
```

### Métriques

L'application expose ces métriques:
- Nombre total d'instances
- Instances par état (running, stopped, etc.)
- Dernière mise à jour

## 🔄 Mises à jour

```bash
# Mettre à jour les dépendances
npm update

# Vérifier les vulnérabilités
npm audit
npm audit fix
```

## 🤝 Contribution

Les contributions sont les bienvenues!

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

Créé avec ❤️ pour simplifier la gestion des instances EC2

## 🙏 Remerciements

- [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/)
- [Express.js](https://expressjs.com/)
- [Inter Font](https://fonts.google.com/specimen/Inter)

## 📚 Ressources

- [Documentation AWS EC2](https://docs.aws.amazon.com/ec2/)
- [AWS SDK JavaScript v2](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Express.js Documentation](https://expressjs.com/en/4x/api.html)

## 🆘 Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Consultez la documentation AWS
- Vérifiez les logs de l'application

---

**⚠️ Disclaimer:** Cette application accède à votre compte AWS. Assurez-vous de comprendre les implications de sécurité et utilisez des credentials avec permissions minimales.

**💡 Tip:** Pour une utilisation en production, ajoutez une couche d'authentification (OAuth, JWT, etc.) pour sécuriser l'accès à l'application.
