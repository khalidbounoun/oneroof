# Gestionnaire d'Instances EC2 AWS

Application web moderne pour gérer (démarrer et arrêter) vos instances EC2 AWS depuis votre navigateur.

## 🚀 Fonctionnalités

- ✅ Affichage de toutes vos instances EC2 avec leurs statuts
- ✅ Démarrer des instances arrêtées
- ✅ Arrêter des instances en cours d'exécution
- ✅ Statistiques en temps réel (total, en cours, arrêtées)
- ✅ Interface utilisateur moderne et responsive
- ✅ Configuration AWS sécurisée (stockage local)
- ✅ Support multi-régions AWS

## 📋 Prérequis

- Un compte AWS avec des instances EC2
- Des credentials AWS (Access Key ID et Secret Access Key) avec les permissions EC2 appropriées
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)

## 🔧 Installation

### Option 1: Utilisation Directe (Frontend uniquement - Développement)

1. Clonez ou téléchargez ce repository
2. Ouvrez `index.html` dans votre navigateur

```bash
# Option A: Ouvrir directement
open index.html

# Option B: Serveur local simple (Python)
python -m http.server 8000

# Option C: Serveur local (Node.js)
npx serve
```

**Note:** Pour utiliser uniquement le frontend, vous devez décommenter les lignes SDK dans `script.js` et inclure AWS SDK dans `index.html`. Cette méthode expose vos credentials côté client - **utilisez uniquement pour le développement!**

### Option 2: Avec Backend API (Recommandé pour la production)

L'application est conçue pour fonctionner avec un backend API qui gère les appels AWS de manière sécurisée.

## 🔐 Configuration

1. Ouvrez l'application dans votre navigateur
2. Remplissez le formulaire de configuration:
   - **Access Key ID**: Votre clé d'accès AWS
   - **Secret Access Key**: Votre clé secrète AWS
   - **Région AWS**: Sélectionnez la région où se trouvent vos instances
3. Cliquez sur "Enregistrer la Configuration"

**Note de sécurité:** Les identifiants sont stockés localement dans votre navigateur (localStorage). Pour la production, utilisez un backend sécurisé.

## 📡 Backend API (Recommandé)

Pour une utilisation en production, créez un backend API qui gère les appels AWS. Voici un exemple avec Node.js/Express:

### Structure du Backend

```javascript
// server.js - Exemple avec Express et AWS SDK
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Lister les instances EC2
app.post('/api/ec2/instances', async (req, res) => {
    const { accessKeyId, secretAccessKey, region } = req.body;
    
    const ec2 = new AWS.EC2({
        accessKeyId,
        secretAccessKey,
        region
    });
    
    try {
        const data = await ec2.describeInstances().promise();
        const instances = [];
        
        data.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
                const tags = {};
                if (instance.Tags) {
                    instance.Tags.forEach(tag => {
                        tags[tag.Key] = tag.Value;
                    });
                }
                
                instances.push({
                    InstanceId: instance.InstanceId,
                    Name: tags.Name || 'Sans nom',
                    State: instance.State.Name,
                    InstanceType: instance.InstanceType,
                    PublicIpAddress: instance.PublicIpAddress || 'N/A',
                    PrivateIpAddress: instance.PrivateIpAddress || 'N/A',
                    LaunchTime: instance.LaunchTime
                });
            });
        });
        
        res.json(instances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Démarrer une instance
app.post('/api/ec2/start', async (req, res) => {
    const { accessKeyId, secretAccessKey, region, instanceId } = req.body;
    
    const ec2 = new AWS.EC2({
        accessKeyId,
        secretAccessKey,
        region
    });
    
    try {
        const data = await ec2.startInstances({ InstanceIds: [instanceId] }).promise();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Arrêter une instance
app.post('/api/ec2/stop', async (req, res) => {
    const { accessKeyId, secretAccessKey, region, instanceId } = req.body;
    
    const ec2 = new AWS.EC2({
        accessKeyId,
        secretAccessKey,
        region
    });
    
    try {
        const data = await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Installation du Backend

```bash
# Créer un nouveau projet Node.js
mkdir ec2-backend
cd ec2-backend
npm init -y

# Installer les dépendances
npm install express aws-sdk cors

# Créer server.js avec le code ci-dessus

# Lancer le serveur
node server.js
```

### Configuration du Frontend

Dans `script.js`, modifiez la constante `API_BASE_URL` pour pointer vers votre backend:

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Changez selon votre backend
```

## 🔒 Sécurité

### Recommandations pour la Production

1. **Ne stockez jamais les credentials dans le frontend**: Utilisez un backend qui gère l'authentification
2. **Utilisez AWS IAM**: Créez un utilisateur IAM avec uniquement les permissions EC2 nécessaires:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ec2:DescribeInstances",
           "ec2:StartInstances",
           "ec2:StopInstances"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
3. **Utilisez HTTPS**: Toujours utiliser HTTPS en production
4. **CORS**: Configurez correctement CORS sur votre backend
5. **Authentification**: Ajoutez un système d'authentification (JWT, OAuth, etc.)

### Alternative: AWS Cognito

Pour une sécurité maximale, utilisez AWS Cognito pour l'authentification et des rôles IAM temporaires.

## 📁 Structure du Projet

```
/workspace/
├── index.html          # Interface utilisateur
├── styles.css          # Styles CSS
├── script.js           # Logique JavaScript
└── README.md          # Documentation
```

## 🎨 Fonctionnalités de l'Interface

- **Liste des instances**: Affichage en grille avec toutes les informations importantes
- **Statuts visuels**: Indicateurs de couleur pour chaque état (en cours, arrêtée, etc.)
- **Actions rapides**: Boutons pour démarrer/arrêter directement depuis la liste
- **Statistiques**: Compteurs en temps réel du nombre d'instances
- **Responsive**: Interface adaptée aux mobiles et tablettes
- **Feedback visuel**: Messages de succès/erreur et indicateurs de chargement

## 🌍 Régions AWS Supportées

L'application supporte toutes les régions AWS principales:
- US East (N. Virginia, Ohio)
- US West (N. California, Oregon)
- EU (Ireland, London, Paris, Frankfurt)
- Asia Pacific (Singapore, Sydney, Tokyo)
- South America (São Paulo)

## 🐛 Résolution de Problèmes

### Les instances ne s'affichent pas

1. Vérifiez vos credentials AWS
2. Vérifiez que la région sélectionnée est correcte
3. Vérifiez les permissions IAM (éc2:DescribeInstances)
4. Ouvrez la console développeur (F12) pour voir les erreurs

### Erreur "Access Denied"

- Vérifiez que votre utilisateur IAM a les permissions nécessaires
- Vérifiez que les credentials sont corrects

### Erreur CORS

- Si vous utilisez un backend, configurez CORS correctement
- Vérifiez que l'URL du backend dans `script.js` est correcte

## 🔄 Mises à Jour Futures

- [ ] Support pour redémarrer une instance
- [ ] Filtrage et recherche d'instances
- [ ] Groupes et tags
- [ ] Historique des actions
- [ ] Notifications en temps réel
- [ ] Support pour plusieurs comptes AWS
- [ ] Export des données

## 📄 License

Ce projet est fourni tel quel pour usage personnel ou professionnel.

## ⚠️ Avertissement

Cette application manipule vos ressources AWS. Assurez-vous de comprendre les conséquences avant de démarrer ou arrêter des instances, notamment:
- Les instances peuvent avoir des coûts associés
- L'arrêt d'une instance peut affecter vos services
- Certaines instances peuvent avoir des disques EBS qui continuent de facturer même quand l'instance est arrêtée

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

---

**Développé avec ❤️ pour la gestion simplifiée d'EC2**
