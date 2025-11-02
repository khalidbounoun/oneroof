# EC2 Instance Manager

Application web moderne pour gérer les instances EC2 AWS. Permet de démarrer, arrêter et redémarrer facilement vos instances EC2 depuis une interface intuitive.

## 🚀 Fonctionnalités

- ✅ **Liste des instances EC2** : Visualisez toutes vos instances avec leurs détails
- 🟢 **Démarrer** : Démarrez des instances arrêtées
- 🔴 **Arrêter** : Arrêtez des instances en cours d'exécution
- 🔄 **Redémarrer** : Redémarrez des instances actives
- 📊 **Statistiques** : Vue d'ensemble avec compteurs d'instances par état
- 🎨 **Interface moderne** : Design responsive et intuitif
- ⚙️ **Configuration flexible** : Support pour credentials AWS ou backend API

## 📋 Prérequis

- Un compte AWS avec des instances EC2
- Des credentials AWS (Access Key ID et Secret Access Key) avec les permissions appropriées
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)

## 🔐 Permissions AWS requises

Votre utilisateur AWS/IAM doit avoir les permissions suivantes :

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

## 🛠️ Installation

1. Clonez ou téléchargez le repository
2. Ouvrez `index.html` dans votre navigateur web

```bash
# Option 1: Ouvrir directement
open index.html

# Option 2: Utiliser un serveur local (recommandé)
python -m http.server 8000
# Puis ouvrez http://localhost:8000 dans votre navigateur

# Option 3: Avec Node.js
npx serve
```

## ⚙️ Configuration

### Option 1: Configuration avec credentials AWS (Frontend uniquement - NON RECOMMANDÉ pour la production)

⚠️ **ATTENTION** : Stocker les credentials AWS dans le localStorage du navigateur n'est **PAS SÉCURISÉ** pour la production. Cette méthode est uniquement recommandée pour le développement et les tests.

1. Ouvrez l'application
2. Cliquez sur "Configuration"
3. Entrez vos credentials AWS :
   - **Access Key ID** : Votre clé d'accès AWS
   - **Secret Access Key** : Votre clé secrète AWS
   - **Région** : Sélectionnez la région AWS (ex: us-east-1, eu-west-1)
4. Cliquez sur "Enregistrer"

### Option 2: Configuration avec Backend API (RECOMMANDÉ pour la production)

Pour une utilisation en production, il est **fortement recommandé** d'utiliser un backend API qui gère les credentials AWS de manière sécurisée.

1. Configurez votre backend API (voir section Backend API ci-dessous)
2. Ouvrez l'application
3. Cliquez sur "Configuration"
4. Entrez l'URL de votre endpoint API dans le champ "Endpoint API"
5. Laissez les champs Access Key ID et Secret Access Key vides
6. Sélectionnez la région AWS
7. Cliquez sur "Enregistrer"

## 🔌 Backend API

L'application peut fonctionner avec un backend API pour une sécurité maximale. Voici la structure API attendue :

### Endpoints requis

#### 1. GET `/instances`
Récupère la liste des instances EC2.

**Headers:**
- `X-Region`: Région AWS (ex: `us-east-1`)

**Response:**
```json
[
    {
        "InstanceId": "i-1234567890abcdef0",
        "InstanceType": "t2.micro",
        "State": {
            "Name": "running",
            "Code": 16
        },
        "LaunchTime": "2024-01-15T10:30:00Z",
        "Tags": [
            {
                "Key": "Name",
                "Value": "Web Server"
            }
        ],
        "PublicIpAddress": "203.0.113.1",
        "PrivateIpAddress": "10.0.1.10"
    }
]
```

#### 2. POST `/instances/{instanceId}/start`
Démarre une instance EC2.

**Headers:**
- `X-Region`: Région AWS

**Response:**
```json
{
    "success": true,
    "message": "Instance démarrée avec succès"
}
```

#### 3. POST `/instances/{instanceId}/stop`
Arrête une instance EC2.

**Headers:**
- `X-Region`: Région AWS

**Response:**
```json
{
    "success": true,
    "message": "Instance arrêtée avec succès"
}
```

#### 4. POST `/instances/{instanceId}/reboot`
Redémarre une instance EC2.

**Headers:**
- `X-Region`: Région AWS

**Response:**
```json
{
    "success": true,
    "message": "Instance redémarrée avec succès"
}
```

### Exemple de backend avec AWS Lambda + API Gateway

Voici un exemple de fonction Lambda Node.js pour gérer les instances :

```javascript
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const ec2 = new AWS.EC2({
        region: event.headers['X-Region'] || 'us-east-1'
    });
    
    const { httpMethod, path, pathParameters } = event;
    
    if (httpMethod === 'GET' && path === '/instances') {
        const data = await ec2.describeInstances().promise();
        const instances = data.Reservations.flatMap(r => r.Instances);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(instances.map(formatInstance))
        };
    }
    
    if (httpMethod === 'POST' && pathParameters) {
        const { instanceId } = pathParameters;
        const action = path.split('/').pop();
        
        let result;
        switch(action) {
            case 'start':
                result = await ec2.startInstances({ InstanceIds: [instanceId] }).promise();
                break;
            case 'stop':
                result = await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
                break;
            case 'reboot':
                result = await ec2.rebootInstances({ InstanceIds: [instanceId] }).promise();
                break;
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true })
        };
    }
};

function formatInstance(instance) {
    return {
        InstanceId: instance.InstanceId,
        InstanceType: instance.InstanceType,
        State: instance.State,
        LaunchTime: instance.LaunchTime,
        Tags: instance.Tags || [],
        PublicIpAddress: instance.PublicIpAddress,
        PrivateIpAddress: instance.PrivateIpAddress
    };
}
```

## 📁 Structure du projet

```
/workspace/
├── index.html      # Interface HTML principale
├── script.js       # Logique JavaScript
├── styles.css      # Styles CSS
└── README.md       # Documentation
```

## 🎨 Interface utilisateur

L'application offre une interface moderne avec :

- **Header** : Titre et boutons d'action (Actualiser, Configuration)
- **Statistiques** : Compteurs d'instances par état (Running, Stopped, Pending)
- **Cartes d'instances** : Affichage détaillé de chaque instance avec :
  - Nom et ID de l'instance
  - Type d'instance
  - État actuel
  - Adresses IP (publique et privée)
  - Date de lancement
  - Tags
  - Boutons d'action contextuels

## 🔒 Sécurité

### ⚠️ IMPORTANT - Recommandations de sécurité

1. **Ne jamais exposer les credentials AWS dans le frontend en production**
   - Utilisez toujours un backend API pour gérer les credentials
   - Stockez les credentials AWS dans des variables d'environnement sécurisées

2. **Utilisez des rôles IAM avec le principe du moindre privilège**
   - Accordez uniquement les permissions nécessaires
   - Limitez les permissions à des ressources spécifiques si possible

3. **Activez MFA (Multi-Factor Authentication)**
   - Protégez votre compte AWS avec MFA

4. **Utilisez HTTPS**
   - Ne déployez jamais l'application sur HTTP en production

5. **Implémentez l'authentification**
   - Ajoutez une authentification utilisateur avant d'accéder à l'application

## 🐛 Dépannage

### Les instances ne s'affichent pas

- Vérifiez que vos credentials AWS sont corrects
- Vérifiez que votre utilisateur IAM a les permissions nécessaires
- Vérifiez que vous avez sélectionné la bonne région AWS
- Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées

### Les actions (start/stop/reboot) ne fonctionnent pas

- Vérifiez les permissions IAM pour les actions EC2
- Vérifiez que l'instance n'est pas dans un état transitoire
- Vérifiez les logs de la console du navigateur

### Erreur CORS

Si vous utilisez un backend API, assurez-vous que votre serveur inclut les headers CORS appropriés :

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Region
```

## 📝 Notes de développement

### Mode démo

L'application inclut des données mockées pour la démonstration lorsque aucun backend API n'est configuré. Ces données sont utilisées uniquement à des fins de test et ne représentent pas de vraies instances EC2.

### Support des navigateurs

- Chrome (dernière version)
- Firefox (dernière version)
- Safari (dernière version)
- Edge (dernière version)

## 📄 Licence

Ce projet est fourni tel quel sans garantie. Utilisez-le à vos propres risques.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📚 Ressources

- [Documentation AWS EC2](https://docs.aws.amazon.com/ec2/)
- [AWS SDK JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

**Développé avec ❤️ pour la gestion simplifiée des instances EC2**
