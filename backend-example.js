/**
 * EXEMPLE DE BACKEND API pour l'application EC2 Manager
 * 
 * Ce fichier est un exemple de serveur backend Node.js/Express
 * qui peut être utilisé avec l'application frontend.
 * 
 * Installation:
 *   npm init -y
 *   npm install express aws-sdk cors
 *   node backend-example.js
 */

const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES API
// ============================================

/**
 * Lister toutes les instances EC2
 * POST /api/ec2/instances
 * Body: { accessKeyId, secretAccessKey, region }
 */
app.post('/api/ec2/instances', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region } = req.body;

        // Validation
        if (!accessKeyId || !secretAccessKey || !region) {
            return res.status(400).json({ 
                message: 'accessKeyId, secretAccessKey et region sont requis' 
            });
        }

        // Configuration AWS
        const ec2 = new AWS.EC2({
            accessKeyId,
            secretAccessKey,
            region
        });

        // Récupérer les instances
        const data = await ec2.describeInstances().promise();
        
        // Transformer les données
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
                    LaunchTime: instance.LaunchTime,
                    AvailabilityZone: instance.Placement.AvailabilityZone || 'N/A'
                });
            });
        });

        res.json(instances);
    } catch (error) {
        console.error('Erreur lors de la récupération des instances:', error);
        res.status(500).json({ 
            message: error.message || 'Erreur lors de la récupération des instances',
            code: error.code
        });
    }
});

/**
 * Démarrer une instance EC2
 * POST /api/ec2/start
 * Body: { accessKeyId, secretAccessKey, region, instanceId }
 */
app.post('/api/ec2/start', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, instanceId } = req.body;

        // Validation
        if (!accessKeyId || !secretAccessKey || !region || !instanceId) {
            return res.status(400).json({ 
                message: 'accessKeyId, secretAccessKey, region et instanceId sont requis' 
            });
        }

        // Configuration AWS
        const ec2 = new AWS.EC2({
            accessKeyId,
            secretAccessKey,
            region
        });

        // Démarrer l'instance
        const data = await ec2.startInstances({ 
            InstanceIds: [instanceId] 
        }).promise();

        res.json({ 
            success: true, 
            message: 'Instance démarrée avec succès',
            data: data.StartingInstances[0]
        });
    } catch (error) {
        console.error('Erreur lors du démarrage:', error);
        res.status(500).json({ 
            message: error.message || 'Erreur lors du démarrage de l\'instance',
            code: error.code
        });
    }
});

/**
 * Arrêter une instance EC2
 * POST /api/ec2/stop
 * Body: { accessKeyId, secretAccessKey, region, instanceId }
 */
app.post('/api/ec2/stop', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, instanceId } = req.body;

        // Validation
        if (!accessKeyId || !secretAccessKey || !region || !instanceId) {
            return res.status(400).json({ 
                message: 'accessKeyId, secretAccessKey, region et instanceId sont requis' 
            });
        }

        // Configuration AWS
        const ec2 = new AWS.EC2({
            accessKeyId,
            secretAccessKey,
            region
        });

        // Arrêter l'instance
        const data = await ec2.stopInstances({ 
            InstanceIds: [instanceId] 
        }).promise();

        res.json({ 
            success: true, 
            message: 'Instance arrêtée avec succès',
            data: data.StoppingInstances[0]
        });
    } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
        res.status(500).json({ 
            message: error.message || 'Erreur lors de l\'arrêt de l\'instance',
            code: error.code
        });
    }
});

/**
 * Route de santé pour vérifier que le serveur fonctionne
 * GET /health
 */
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================
// GESTION DES ERREURS
// ============================================

app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({ 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur EC2 Manager API démarré`);
    console.log(`📍 http://${HOST}:${PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   POST /api/ec2/instances - Lister les instances`);
    console.log(`   POST /api/ec2/start - Démarrer une instance`);
    console.log(`   POST /api/ec2/stop - Arrêter une instance`);
    console.log(`   GET  /health - Vérifier l'état du serveur`);
});
