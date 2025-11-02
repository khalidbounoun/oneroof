/**
 * EC2 Instance Manager
 * Application web pour gérer les instances EC2 AWS
 */

// Configuration AWS
let awsConfig = {
    accessKeyId: localStorage.getItem('aws_access_key_id') || '',
    secretAccessKey: localStorage.getItem('aws_secret_access_key') || '',
    region: localStorage.getItem('aws_region') || 'us-east-1',
    apiEndpoint: localStorage.getItem('aws_api_endpoint') || ''
};

// État de l'application
let instances = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Charger la configuration sauvegardée
    loadConfig();
    
    // Écouteurs d'événements
    document.getElementById('refreshBtn').addEventListener('click', loadInstances);
    document.getElementById('configBtn').addEventListener('click', openConfigModal);
    document.getElementById('configForm').addEventListener('submit', saveConfig);
    
    // Charger les instances au démarrage
    if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
        loadInstances();
    } else {
        showConfigModal();
    }
}

// Charger la configuration depuis localStorage
function loadConfig() {
    const accessKeyId = document.getElementById('accessKeyId');
    const secretAccessKey = document.getElementById('secretAccessKey');
    const region = document.getElementById('region');
    const apiEndpoint = document.getElementById('apiEndpoint');
    
    if (accessKeyId) accessKeyId.value = awsConfig.accessKeyId;
    if (secretAccessKey) secretAccessKey.value = awsConfig.secretAccessKey ? '••••••••••••••••' : '';
    if (region) region.value = awsConfig.region;
    if (apiEndpoint) apiEndpoint.value = awsConfig.apiEndpoint;
}

// Sauvegarder la configuration
function saveConfig(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    awsConfig.accessKeyId = formData.get('accessKeyId');
    awsConfig.secretAccessKey = formData.get('secretAccessKey');
    awsConfig.region = formData.get('region');
    awsConfig.apiEndpoint = formData.get('apiEndpoint');
    
    // Sauvegarder dans localStorage
    localStorage.setItem('aws_access_key_id', awsConfig.accessKeyId);
    localStorage.setItem('aws_secret_access_key', awsConfig.secretAccessKey);
    localStorage.setItem('aws_region', awsConfig.region);
    localStorage.setItem('aws_api_endpoint', awsConfig.apiEndpoint);
    
    closeConfigModal();
    loadInstances();
}

// Modals
function openConfigModal() {
    document.getElementById('configModal').style.display = 'flex';
    // Ne pas afficher le secret en clair
    const secretInput = document.getElementById('secretAccessKey');
    if (secretInput.value === '••••••••••••••••') {
        secretInput.value = '';
    }
}

function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

// Charger les instances EC2
async function loadInstances() {
    showLoading();
    
    try {
        if (awsConfig.apiEndpoint) {
            // Utiliser un backend proxy
            instances = await fetchInstancesFromAPI();
        } else {
            // Utiliser AWS SDK directement (nécessite un backend pour la sécurité)
            // Pour cette démo, on utilise des données mockées
            // En production, il faudrait un backend sécurisé
            instances = await fetchInstancesDirect();
        }
        
        if (instances.length === 0) {
            showEmpty();
        } else {
            displayInstances(instances);
            updateStats(instances);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des instances:', error);
        showError(error.message || 'Impossible de charger les instances EC2');
    }
}

// Charger les instances depuis un backend API
async function fetchInstancesFromAPI() {
    const response = await fetch(`${awsConfig.apiEndpoint}/instances`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Region': awsConfig.region
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
    }
    
    return await response.json();
}

// Charger les instances directement (mock pour démo)
async function fetchInstancesDirect() {
    // Note: En production, cela devrait être fait via un backend sécurisé
    // car exposer les credentials AWS dans le frontend est une faille de sécurité
    
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Données mockées pour la démonstration
    // En production, remplacer par un appel AWS SDK depuis un backend
    return [
        {
            InstanceId: 'i-1234567890abcdef0',
            InstanceType: 't2.micro',
            State: { Name: 'running', Code: 16 },
            LaunchTime: new Date(Date.now() - 86400000).toISOString(),
            Tags: [
                { Key: 'Name', Value: 'Web Server' },
                { Key: 'Environment', Value: 'Production' }
            ],
            PublicIpAddress: '203.0.113.1',
            PrivateIpAddress: '10.0.1.10'
        },
        {
            InstanceId: 'i-0987654321fedcba0',
            InstanceType: 't3.small',
            State: { Name: 'stopped', Code: 80 },
            LaunchTime: new Date(Date.now() - 259200000).toISOString(),
            Tags: [
                { Key: 'Name', Value: 'Database Server' },
                { Key: 'Environment', Value: 'Development' }
            ],
            PublicIpAddress: null,
            PrivateIpAddress: '10.0.1.11'
        },
        {
            InstanceId: 'i-abcdef1234567890',
            InstanceType: 't2.medium',
            State: { Name: 'pending', Code: 0 },
            LaunchTime: new Date().toISOString(),
            Tags: [
                { Key: 'Name', Value: 'Backup Server' },
                { Key: 'Environment', Value: 'Production' }
            ],
            PublicIpAddress: null,
            PrivateIpAddress: null
        }
    ];
}

// Afficher les instances
function displayInstances(instancesList) {
    const grid = document.getElementById('instancesGrid');
    grid.innerHTML = '';
    
    instancesList.forEach(instance => {
        const card = createInstanceCard(instance);
        grid.appendChild(card);
    });
    
    showInstances();
}

// Créer une carte d'instance
function createInstanceCard(instance) {
    const card = document.createElement('div');
    card.className = `instance-card instance-card--${instance.State.Name}`;
    
    const name = getTagValue(instance.Tags, 'Name') || instance.InstanceId;
    const state = instance.State.Name;
    const stateLabel = getStateLabel(state);
    
    card.innerHTML = `
        <div class="instance-card__header">
            <div class="instance-card__title">
                <h3>${name}</h3>
                <span class="instance-id">${instance.InstanceId}</span>
            </div>
            <div class="instance-card__state state-badge state-badge--${state}">
                ${stateLabel}
            </div>
        </div>
        
        <div class="instance-card__body">
            <div class="instance-info">
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${instance.InstanceType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">État:</span>
                    <span class="info-value">${stateLabel}</span>
                </div>
                ${instance.PublicIpAddress ? `
                <div class="info-item">
                    <span class="info-label">IP Publique:</span>
                    <span class="info-value">${instance.PublicIpAddress}</span>
                </div>
                ` : ''}
                ${instance.PrivateIpAddress ? `
                <div class="info-item">
                    <span class="info-label">IP Privée:</span>
                    <span class="info-value">${instance.PrivateIpAddress}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Lancée:</span>
                    <span class="info-value">${formatDate(instance.LaunchTime)}</span>
                </div>
            </div>
            
            ${instance.Tags && instance.Tags.length > 0 ? `
            <div class="instance-tags">
                ${instance.Tags.map(tag => `
                    <span class="tag">${tag.Key}: ${tag.Value}</span>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="instance-card__actions">
            ${state === 'stopped' || state === 'stopping' ? `
            <button class="btn btn--success btn--small" onclick="startInstance('${instance.InstanceId}')" 
                    ${state === 'stopping' ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Démarrer
            </button>
            ` : ''}
            ${state === 'running' || state === 'pending' ? `
            <button class="btn btn--danger btn--small" onclick="stopInstance('${instance.InstanceId}')"
                    ${state === 'pending' ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="6" width="12" height="12"/>
                </svg>
                Arrêter
            </button>
            ` : ''}
            ${state === 'running' ? `
            <button class="btn btn--warning btn--small" onclick="rebootInstance('${instance.InstanceId}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                </svg>
                Redémarrer
            </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Démarrer une instance
async function startInstance(instanceId) {
    if (!confirm(`Êtes-vous sûr de vouloir démarrer l'instance ${instanceId}?`)) {
        return;
    }
    
    try {
        await executeInstanceAction(instanceId, 'start');
        showNotification(`Instance ${instanceId} en cours de démarrage...`, 'success');
        setTimeout(loadInstances, 2000);
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

// Arrêter une instance
async function stopInstance(instanceId) {
    if (!confirm(`Êtes-vous sûr de vouloir arrêter l'instance ${instanceId}?`)) {
        return;
    }
    
    try {
        await executeInstanceAction(instanceId, 'stop');
        showNotification(`Instance ${instanceId} en cours d'arrêt...`, 'success');
        setTimeout(loadInstances, 2000);
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

// Redémarrer une instance
async function rebootInstance(instanceId) {
    if (!confirm(`Êtes-vous sûr de vouloir redémarrer l'instance ${instanceId}?`)) {
        return;
    }
    
    try {
        await executeInstanceAction(instanceId, 'reboot');
        showNotification(`Instance ${instanceId} en cours de redémarrage...`, 'success');
        setTimeout(loadInstances, 2000);
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

// Exécuter une action sur une instance
async function executeInstanceAction(instanceId, action) {
    if (awsConfig.apiEndpoint) {
        // Via backend API
        const response = await fetch(`${awsConfig.apiEndpoint}/instances/${instanceId}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Region': awsConfig.region
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de l\'exécution de l\'action');
        }
        
        return await response.json();
    } else {
        // Simulation pour la démo
        // En production, cela devrait être fait via un backend sécurisé
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: `Action ${action} exécutée avec succès` };
    }
}

// Mettre à jour les statistiques
function updateStats(instancesList) {
    const stats = {
        running: instancesList.filter(i => i.State.Name === 'running').length,
        stopped: instancesList.filter(i => i.State.Name === 'stopped').length,
        pending: instancesList.filter(i => i.State.Name === 'pending' || i.State.Name === 'stopping' || i.State.Name === 'starting').length
    };
    
    document.getElementById('runningCount').textContent = stats.running;
    document.getElementById('stoppedCount').textContent = stats.stopped;
    document.getElementById('pendingCount').textContent = stats.pending;
}

// Utilitaires
function getTagValue(tags, key) {
    if (!tags) return null;
    const tag = tags.find(t => t.Key === key);
    return tag ? tag.Value : null;
}

function getStateLabel(state) {
    const labels = {
        'running': 'En cours d\'exécution',
        'stopped': 'Arrêtée',
        'stopping': 'Arrêt en cours',
        'starting': 'Démarrage en cours',
        'pending': 'En attente',
        'stopped': 'Arrêtée',
        'terminated': 'Terminée'
    };
    return labels[state] || state;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Affichage des états
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
    document.getElementById('instancesList').style.display = 'none';
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
    document.getElementById('empty').style.display = 'none';
    document.getElementById('instancesList').style.display = 'none';
    document.getElementById('errorMessage').textContent = message;
}

function showEmpty() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'flex';
    document.getElementById('instancesList').style.display = 'none';
}

function showInstances() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
    document.getElementById('instancesList').style.display = 'block';
}

function showConfigModal() {
    openConfigModal();
}

// Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification--show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('notification--show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
