/**
 * Gestionnaire d'Instances EC2 AWS
 * Application web pour démarrer et arrêter des instances EC2
 */

// Configuration stockée localement
let awsConfig = {
    accessKeyId: null,
    secretAccessKey: null,
    region: null
};

// Éléments DOM
const configSection = document.getElementById('configSection');
const configForm = document.getElementById('configForm');
const instancesSection = document.getElementById('instancesSection');
const instancesGrid = document.getElementById('instancesGrid');
const loadingState = document.getElementById('loadingState');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');
const refreshBtn = document.getElementById('refreshBtn');
const emptyState = document.getElementById('emptyState');

// États des compteurs
const totalInstancesEl = document.getElementById('totalInstances');
const runningInstancesEl = document.getElementById('runningInstances');
const stoppedInstancesEl = document.getElementById('stoppedInstances');

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupEventListeners();
    
    // Si config existe, charger les instances
    if (awsConfig.accessKeyId && awsConfig.secretAccessKey && awsConfig.region) {
        configSection.style.display = 'none';
        instancesSection.style.display = 'block';
        loadInstances();
    }
});

// ============================================
// GESTION DE LA CONFIGURATION
// ============================================

function setupEventListeners() {
    configForm.addEventListener('submit', handleConfigSubmit);
    refreshBtn.addEventListener('click', loadInstances);
}

function loadConfig() {
    const saved = localStorage.getItem('awsConfig');
    if (saved) {
        awsConfig = JSON.parse(saved);
        document.getElementById('accessKey').value = awsConfig.accessKeyId || '';
        document.getElementById('secretKey').value = awsConfig.secretAccessKey || '';
        document.getElementById('region').value = awsConfig.region || 'us-east-1';
    }
}

function handleConfigSubmit(e) {
    e.preventDefault();
    
    awsConfig = {
        accessKeyId: document.getElementById('accessKey').value.trim(),
        secretAccessKey: document.getElementById('secretKey').value.trim(),
        region: document.getElementById('region').value
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('awsConfig', JSON.stringify(awsConfig));
    
    // Afficher la section instances
    configSection.style.display = 'none';
    instancesSection.style.display = 'block';
    
    // Charger les instances
    loadInstances();
    
    showSuccess('Configuration enregistrée avec succès!');
}

// ============================================
// CHARGEMENT DES INSTANCES
// ============================================

async function loadInstances() {
    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey || !awsConfig.region) {
        showError('Veuillez configurer vos identifiants AWS d\'abord.');
        return;
    }
    
    showLoading(true);
    hideAlerts();
    
    try {
        // Option 1: Utiliser un backend API (recommandé pour la production)
        const instances = await fetchInstancesFromAPI();
        
        // Option 2: Utiliser AWS SDK directement (pour développement/démo)
        // Décommentez la ligne suivante si vous utilisez AWS SDK dans le navigateur
        // const instances = await fetchInstancesWithSDK();
        
        displayInstances(instances);
        updateStats(instances);
        
        if (instances.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des instances:', error);
        showError(`Erreur: ${error.message || 'Impossible de charger les instances. Vérifiez vos identifiants et votre connexion.'}`);
    } finally {
        showLoading(false);
    }
}

// ============================================
// API BACKEND (Recommandé pour la production)
// ============================================

async function fetchInstancesFromAPI() {
    // Remplacez cette URL par l'URL de votre backend API
    const API_BASE_URL = 'http://localhost:3000/api'; // Changez selon votre backend
    
    const response = await fetch(`${API_BASE_URL}/ec2/instances`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey,
            region: awsConfig.region
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur API');
    }
    
    return await response.json();
}

async function startInstance(instanceId) {
    const API_BASE_URL = 'http://localhost:3000/api'; // Changez selon votre backend
    
    const response = await fetch(`${API_BASE_URL}/ec2/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey,
            region: awsConfig.region,
            instanceId: instanceId
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du démarrage');
    }
    
    return await response.json();
}

async function stopInstance(instanceId) {
    const API_BASE_URL = 'http://localhost:3000/api'; // Changez selon votre backend
    
    const response = await fetch(`${API_BASE_URL}/ec2/stop`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey,
            region: awsConfig.region,
            instanceId: instanceId
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'arrêt');
    }
    
    return await response.json();
}

// ============================================
// AWS SDK DIRECT (Pour développement uniquement)
// ============================================

/**
 * NOTE: Pour utiliser cette fonction, vous devez:
 * 1. Inclure AWS SDK dans index.html: <script src="https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js"></script>
 * 2. Décommenter l'appel à fetchInstancesWithSDK dans loadInstances()
 * 
 * ATTENTION: Cette méthode expose vos credentials côté client. Utilisez uniquement pour le développement!
 */

async function fetchInstancesWithSDK() {
    // Vérifier si AWS SDK est disponible
    if (typeof AWS === 'undefined') {
        throw new Error('AWS SDK n\'est pas chargé. Utilisez un backend API pour la production.');
    }
    
    const ec2 = new AWS.EC2({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region
    });
    
    return new Promise((resolve, reject) => {
        ec2.describeInstances({}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            
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
            
            resolve(instances);
        });
    });
}

async function startInstanceSDK(instanceId) {
    if (typeof AWS === 'undefined') {
        throw new Error('AWS SDK n\'est pas chargé.');
    }
    
    const ec2 = new AWS.EC2({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region
    });
    
    return new Promise((resolve, reject) => {
        ec2.startInstances({ InstanceIds: [instanceId] }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

async function stopInstanceSDK(instanceId) {
    if (typeof AWS === 'undefined') {
        throw new Error('AWS SDK n\'est pas chargé.');
    }
    
    const ec2 = new AWS.EC2({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region
    });
    
    return new Promise((resolve, reject) => {
        ec2.stopInstances({ InstanceIds: [instanceId] }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

// ============================================
// AFFICHAGE DES INSTANCES
// ============================================

function displayInstances(instances) {
    instancesGrid.innerHTML = '';
    
    instances.forEach(instance => {
        const card = createInstanceCard(instance);
        instancesGrid.appendChild(card);
    });
}

function createInstanceCard(instance) {
    const card = document.createElement('div');
    card.className = 'instance-card';
    
    const state = instance.State.toLowerCase();
    const stateClass = `instance-card__status--${state}`;
    const stateLabel = getStateLabel(state);
    
    card.innerHTML = `
        <div class="instance-card__header">
            <div>
                <div class="instance-card__name">${escapeHtml(instance.Name)}</div>
                <div class="instance-card__id">${instance.InstanceId}</div>
            </div>
            <span class="instance-card__status ${stateClass}">
                <span class="instance-card__status-dot"></span>
                ${stateLabel}
            </span>
        </div>
        
        <div class="instance-card__details">
            <div class="instance-card__detail">
                <span class="instance-card__detail-label">Type:</span>
                <span class="instance-card__detail-value">${instance.InstanceType}</span>
            </div>
            <div class="instance-card__detail">
                <span class="instance-card__detail-label">IP Publique:</span>
                <span class="instance-card__detail-value">${instance.PublicIpAddress || 'N/A'}</span>
            </div>
            <div class="instance-card__detail">
                <span class="instance-card__detail-label">IP Privée:</span>
                <span class="instance-card__detail-value">${instance.PrivateIpAddress || 'N/A'}</span>
            </div>
        </div>
        
        <div class="instance-card__actions">
            ${state === 'stopped' || state === 'stopping' ? 
                `<button class="btn btn--success" onclick="handleStartInstance('${instance.InstanceId}')" ${state === 'stopping' ? 'disabled' : ''}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Démarrer
                </button>` : ''
            }
            ${state === 'running' || state === 'pending' ? 
                `<button class="btn btn--danger" onclick="handleStopInstance('${instance.InstanceId}')" ${state === 'pending' ? 'disabled' : ''}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                    Arrêter
                </button>` : ''
            }
        </div>
    `;
    
    return card;
}

function getStateLabel(state) {
    const labels = {
        'running': 'En cours',
        'stopped': 'Arrêtée',
        'stopping': 'En arrêt...',
        'pending': 'En attente',
        'shutting-down': 'Arrêt en cours',
        'terminated': 'Terminée'
    };
    return labels[state] || state;
}

function updateStats(instances) {
    const total = instances.length;
    const running = instances.filter(i => i.State.toLowerCase() === 'running').length;
    const stopped = instances.filter(i => i.State.toLowerCase() === 'stopped').length;
    
    totalInstancesEl.textContent = total;
    runningInstancesEl.textContent = running;
    stoppedInstancesEl.textContent = stopped;
}

// ============================================
// ACTIONS SUR LES INSTANCES
// ============================================

async function handleStartInstance(instanceId) {
    if (!confirm('Êtes-vous sûr de vouloir démarrer cette instance?')) {
        return;
    }
    
    try {
        showLoading(true);
        hideAlerts();
        
        // Utiliser l'API backend ou SDK
        await startInstance(instanceId);
        // Pour SDK: await startInstanceSDK(instanceId);
        
        showSuccess('Instance démarrée avec succès!');
        
        // Rafraîchir la liste après un court délai
        setTimeout(() => {
            loadInstances();
        }, 2000);
    } catch (error) {
        console.error('Erreur lors du démarrage:', error);
        showError(`Erreur: ${error.message || 'Impossible de démarrer l\'instance'}`);
    } finally {
        showLoading(false);
    }
}

async function handleStopInstance(instanceId) {
    if (!confirm('Êtes-vous sûr de vouloir arrêter cette instance?')) {
        return;
    }
    
    try {
        showLoading(true);
        hideAlerts();
        
        // Utiliser l'API backend ou SDK
        await stopInstance(instanceId);
        // Pour SDK: await stopInstanceSDK(instanceId);
        
        showSuccess('Instance arrêtée avec succès!');
        
        // Rafraîchir la liste après un court délai
        setTimeout(() => {
            loadInstances();
        }, 2000);
    } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
        showError(`Erreur: ${error.message || 'Impossible d\'arrêter l\'instance'}`);
    } finally {
        showLoading(false);
    }
}

// Rendre les fonctions globales pour les onclick
window.handleStartInstance = handleStartInstance;
window.handleStopInstance = handleStopInstance;

// ============================================
// UTILITAIRES UI
// ============================================

function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorAlert.style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
    setTimeout(() => {
        hideAlerts();
    }, 5000);
}

function showSuccess(message) {
    successAlert.style.display = 'flex';
    document.getElementById('successMessage').textContent = message;
    setTimeout(() => {
        hideAlerts();
    }, 3000);
}

function hideAlerts() {
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
