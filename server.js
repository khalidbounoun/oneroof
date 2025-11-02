const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ec2 = new AWS.EC2();

// Route pour obtenir toutes les instances EC2
app.get('/api/instances', async (req, res) => {
  try {
    const params = {};
    const data = await ec2.describeInstances(params).promise();
    
    const instances = [];
    data.Reservations.forEach(reservation => {
      reservation.Instances.forEach(instance => {
        const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
        instances.push({
          id: instance.InstanceId,
          name: nameTag ? nameTag.Value : 'Sans nom',
          state: instance.State.Name,
          type: instance.InstanceType,
          publicIp: instance.PublicIpAddress || 'N/A',
          privateIp: instance.PrivateIpAddress || 'N/A',
          launchTime: instance.LaunchTime,
          availabilityZone: instance.Placement.AvailabilityZone
        });
      });
    });
    
    res.json({
      success: true,
      instances: instances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des instances:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour démarrer une instance
app.post('/api/instances/:instanceId/start', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const params = {
      InstanceIds: [instanceId]
    };
    
    const data = await ec2.startInstances(params).promise();
    
    res.json({
      success: true,
      message: `Instance ${instanceId} en cours de démarrage`,
      data: data.StartingInstances
    });
  } catch (error) {
    console.error('Erreur lors du démarrage de l\'instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour arrêter une instance
app.post('/api/instances/:instanceId/stop', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const params = {
      InstanceIds: [instanceId]
    };
    
    const data = await ec2.stopInstances(params).promise();
    
    res.json({
      success: true,
      message: `Instance ${instanceId} en cours d'arrêt`,
      data: data.StoppingInstances
    });
  } catch (error) {
    console.error('Erreur lors de l\'arrêt de l\'instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour redémarrer une instance
app.post('/api/instances/:instanceId/reboot', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const params = {
      InstanceIds: [instanceId]
    };
    
    await ec2.rebootInstances(params).promise();
    
    res.json({
      success: true,
      message: `Instance ${instanceId} en cours de redémarrage`
    });
  } catch (error) {
    console.error('Erreur lors du redémarrage de l\'instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour obtenir les détails d'une instance spécifique
app.get('/api/instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const params = {
      InstanceIds: [instanceId]
    };
    
    const data = await ec2.describeInstances(params).promise();
    
    if (data.Reservations.length > 0 && data.Reservations[0].Instances.length > 0) {
      const instance = data.Reservations[0].Instances[0];
      const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
      
      res.json({
        success: true,
        instance: {
          id: instance.InstanceId,
          name: nameTag ? nameTag.Value : 'Sans nom',
          state: instance.State.Name,
          type: instance.InstanceType,
          publicIp: instance.PublicIpAddress || 'N/A',
          privateIp: instance.PrivateIpAddress || 'N/A',
          launchTime: instance.LaunchTime,
          availabilityZone: instance.Placement.AvailabilityZone,
          vpcId: instance.VpcId,
          subnetId: instance.SubnetId,
          securityGroups: instance.SecurityGroups,
          tags: instance.Tags
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Instance non trouvée'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API EC2 Manager opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur EC2 Manager démarré sur le port ${PORT}`);
  console.log(`📍 URL locale: http://localhost:${PORT}`);
  console.log(`🔧 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`\n⚙️  Configuration AWS:`);
  console.log(`   - Région: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`   - Credentials: ${process.env.AWS_ACCESS_KEY_ID ? '✓ Configuré' : '✗ Non configuré'}\n`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('Erreur non gérée:', error);
});
