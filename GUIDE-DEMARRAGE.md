# 🚀 Guide de Démarrage Rapide - EC2 Manager

## Vue d'ensemble

Vous disposez maintenant d'une application web complète pour gérer vos instances EC2 AWS !

## 📦 Ce qui a été créé

### Backend (Node.js + Express)
- ✅ **server.js** - Serveur API REST avec AWS SDK
- ✅ **package.json** - Configuration et dépendances npm

### Frontend (HTML/CSS/JavaScript)
- ✅ **public/index.html** - Interface utilisateur moderne
- ✅ **public/styles.css** - Design AWS-inspired responsive
- ✅ **public/app.js** - Logique frontend et appels API

### Configuration
- ✅ **.env.example** - Template de configuration
- ✅ **.gitignore** - Fichiers à ignorer par Git
- ✅ **EC2-MANAGER-README.md** - Documentation complète

## 🎯 Démarrage en 3 étapes

### Étape 1: Installer les dépendances

```bash
npm install
```

Cela installera:
- express (serveur web)
- aws-sdk (AWS SDK pour JavaScript)
- cors (gestion CORS)
- dotenv (variables d'environnement)

### Étape 2: Configurer AWS

1. Créez votre fichier de configuration:
```bash
cp .env.example .env
```

2. Éditez `.env` et ajoutez vos credentials AWS:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=VOTRE_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=VOTRE_SECRET_ACCESS_KEY
PORT=3000
```

**Comment obtenir vos credentials AWS:**
1. Connectez-vous à AWS Console
2. Allez dans IAM > Users
3. Créez un nouvel utilisateur ou sélectionnez un existant
4. Créez une Access Key
5. Attachez la politique avec les permissions EC2 (voir ci-dessous)

**Permissions IAM nécessaires:**
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

### Étape 3: Lancer l'application

```bash
npm start
```

L'application sera accessible sur: **http://localhost:3000**

## 🎨 Fonctionnalités disponibles

### Tableau de bord
- 📊 Statistiques en temps réel
  - Total des instances
  - Instances en cours d'exécution
  - Instances arrêtées
  - Autres états

### Gestion des instances
- ▶️ **Démarrer** une instance arrêtée
- ⏹️ **Arrêter** une instance en cours
- 🔄 **Redémarrer** une instance
- 👁️ **Voir les détails** complets

### Filtres et recherche
- 🔍 Rechercher par nom ou ID
- 🏷️ Filtrer par état (running, stopped, etc.)
- ⚡ Actualisation automatique (30s)

## 📱 Interface utilisateur

### États visuels
- 🟢 **En cours** - Instance running (vert)
- 🔴 **Arrêté** - Instance stopped (rouge)
- 🟡 **En attente** - Instance pending/stopping (orange)

### Actions rapides
Chaque carte d'instance affiche:
- Nom et ID de l'instance
- État actuel
- Type d'instance
- IPs publique et privée
- Zone de disponibilité
- Boutons d'action contextuelle

## 🔧 Commandes utiles

```bash
# Démarrer en mode développement (avec auto-reload)
npm run dev

# Démarrer en production
npm start

# Vérifier les vulnérabilités
npm audit

# Mettre à jour les dépendances
npm update
```

## 🌐 Accès depuis un autre ordinateur

Pour accéder à l'application depuis un autre appareil sur le même réseau:

1. Trouvez votre IP locale:
```bash
# Linux/Mac
ifconfig | grep inet

# Windows
ipconfig
```

2. Modifiez `server.js` (ligne du listen):
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

3. Accédez via: `http://VOTRE_IP:3000`

## 🐛 Résolution de problèmes

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Unable to locate credentials"
- Vérifiez que `.env` existe et contient les bonnes valeurs
- Les variables doivent être exactement: `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY`

### "Port 3000 already in use"
Changez le port dans `.env`:
```env
PORT=3001
```

### Aucune instance ne s'affiche
- Vérifiez la région dans `.env` (ex: `us-east-1`)
- Assurez-vous d'avoir des instances EC2 dans cette région
- Vérifiez les permissions IAM

## 📚 Structure des fichiers

```
/workspace/
├── public/              # Fichiers frontend
│   ├── index.html      # Interface principale
│   ├── styles.css      # Styles
│   └── app.js          # Logique frontend
├── server.js           # Backend API
├── package.json        # Dépendances
├── .env.example        # Template config
├── .env               # Votre config (à créer)
├── .gitignore         # Git ignore
└── EC2-MANAGER-README.md  # Documentation complète
```

## 🚀 Prochaines étapes

1. **Testez l'application** avec vos instances EC2
2. **Personnalisez** les couleurs dans `styles.css` si besoin
3. **Déployez** sur un serveur pour un accès permanent
4. **Ajoutez l'authentification** pour sécuriser l'accès

## 🔐 Sécurité - Important!

- ⚠️ Ne commitez JAMAIS le fichier `.env` dans Git
- ⚠️ Ne partagez JAMAIS vos credentials AWS
- ⚠️ Utilisez des permissions IAM minimales
- ⚠️ En production, ajoutez une authentification (OAuth, JWT, etc.)

## 💡 Conseils

### Pour le développement
- Utilisez `npm run dev` pour le rechargement automatique
- Consultez les logs dans le terminal pour le debug
- Utilisez les DevTools du navigateur (F12)

### Pour la production
- Installez PM2: `npm install -g pm2`
- Lancez: `pm2 start server.js --name ec2-manager`
- Configurez nginx comme reverse proxy
- Utilisez HTTPS avec Let's Encrypt

## 📖 Documentation complète

Pour plus de détails, consultez **EC2-MANAGER-README.md**

## 🆘 Besoin d'aide ?

1. Consultez la console du navigateur (F12)
2. Vérifiez les logs du serveur
3. Consultez la documentation AWS EC2
4. Vérifiez les permissions IAM

## ✨ Fonctionnalités futures possibles

- 🔐 Authentification utilisateur
- 📊 Graphiques de métriques CloudWatch
- 📧 Notifications par email
- 🏷️ Gestion des tags
- 💰 Analyse des coûts
- 📅 Planification start/stop automatique
- 🌍 Multi-régions
- 👥 Gestion multi-utilisateurs

---

**Bon développement! 🚀**

Pour toute question, consultez le README complet ou la documentation AWS.
