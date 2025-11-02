/**
 * EC2 Instance Manager - Frontend Application
 * Handles all frontend interactions and API calls
 */

// Configuration
const API_BASE_URL = window.location.origin;
let instances = [];
let filteredInstances = [];

// DOM Elements
const elements = {
  // Stats
  totalInstances: document.getElementById('totalInstances'),
  runningInstances: document.getElementById('runningInstances'),
  stoppedInstances: document.getElementById('stoppedInstances'),
  otherInstances: document.getElementById('otherInstances'),
  
  // States
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  instancesGrid: document.getElementById('instancesGrid'),
  
  // Filters
  stateFilter: document.getElementById('stateFilter'),
  searchInput: document.getElementById('searchInput'),
  
  // Other
  refreshBtn: document.getElementById('refreshBtn'),
  lastUpdate: document.getElementById('lastUpdate'),
  apiStatus: document.getElementById('apiStatus'),
  toastContainer: document.getElementById('toastContainer'),
  instanceModal: document.getElementById('instanceModal'),
  modalBody: document.getElementById('modalBody')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  console.log('🚀 Initializing EC2 Manager...');
  
  // Check API health
  await checkAPIHealth();
  
  // Load instances
  await loadInstances();
  
  // Setup event listeners
  setupEventListeners();
}

// Check API Health
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.success) {
      updateAPIStatus('online', 'API connectée');
    } else {
      updateAPIStatus('offline', 'API hors ligne');
    }
  } catch (error) {
    console.error('API Health check failed:', error);
    updateAPIStatus('offline', 'API hors ligne');
  }
}

function updateAPIStatus(status, text) {
  elements.apiStatus.className = `status-indicator ${status}`;
  elements.apiStatus.querySelector('.status-text').textContent = text;
}

// Load Instances
async function loadInstances() {
  try {
    // Show loading state
    showState('loading');
    
    const response = await fetch(`${API_BASE_URL}/api/instances`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du chargement des instances');
    }
    
    instances = data.instances;
    filteredInstances = [...instances];
    
    // Update UI
    updateStats();
    applyFilters();
    updateLastUpdate();
    
    if (instances.length === 0) {
      showState('empty');
    } else {
      showState('content');
      renderInstances();
    }
    
    showToast('Instances chargées avec succès', 'success');
  } catch (error) {
    console.error('Error loading instances:', error);
    showState('error', error.message);
    showToast(error.message, 'error');
  }
}

// Show different states
function showState(state, message = '') {
  elements.loadingState.style.display = 'none';
  elements.errorState.style.display = 'none';
  elements.emptyState.style.display = 'none';
  elements.instancesGrid.style.display = 'none';
  
  switch(state) {
    case 'loading':
      elements.loadingState.style.display = 'flex';
      break;
    case 'error':
      elements.errorState.style.display = 'flex';
      if (message) {
        document.getElementById('errorMessage').textContent = message;
      }
      break;
    case 'empty':
      elements.emptyState.style.display = 'flex';
      break;
    case 'content':
      elements.instancesGrid.style.display = 'grid';
      break;
  }
}

// Update statistics
function updateStats() {
  const stats = {
    total: instances.length,
    running: instances.filter(i => i.state === 'running').length,
    stopped: instances.filter(i => i.state === 'stopped').length,
    other: instances.filter(i => !['running', 'stopped'].includes(i.state)).length
  };
  
  animateCounter(elements.totalInstances, stats.total);
  animateCounter(elements.runningInstances, stats.running);
  animateCounter(elements.stoppedInstances, stats.stopped);
  animateCounter(elements.otherInstances, stats.other);
}

function animateCounter(element, target) {
  const current = parseInt(element.textContent) || 0;
  const increment = target > current ? 1 : -1;
  const duration = 500;
  const steps = Math.abs(target - current);
  const stepDuration = steps > 0 ? duration / steps : 0;
  
  let value = current;
  
  const timer = setInterval(() => {
    value += increment;
    element.textContent = value;
    
    if (value === target) {
      clearInterval(timer);
    }
  }, stepDuration);
}

// Apply filters
function applyFilters() {
  const stateFilter = elements.stateFilter.value;
  const searchTerm = elements.searchInput.value.toLowerCase();
  
  filteredInstances = instances.filter(instance => {
    // State filter
    const matchesState = stateFilter === 'all' || instance.state === stateFilter;
    
    // Search filter
    const matchesSearch = searchTerm === '' || 
      instance.name.toLowerCase().includes(searchTerm) ||
      instance.id.toLowerCase().includes(searchTerm);
    
    return matchesState && matchesSearch;
  });
  
  renderInstances();
}

// Render instances
function renderInstances() {
  if (filteredInstances.length === 0) {
    elements.instancesGrid.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
        <p>Aucune instance ne correspond à vos critères de recherche</p>
      </div>
    `;
    return;
  }
  
  elements.instancesGrid.innerHTML = filteredInstances.map(instance => {
    const statusClass = getStatusClass(instance.state);
    const statusText = getStatusText(instance.state);
    
    return `
      <div class="instance-card" data-instance-id="${instance.id}">
        <div class="instance-header">
          <div class="instance-title">
            <div class="instance-name">
              <span>${instance.name}</span>
            </div>
            <div class="instance-id">${instance.id}</div>
          </div>
          <div class="instance-status ${statusClass}">
            <span class="status-dot-small"></span>
            ${statusText}
          </div>
        </div>
        
        <div class="instance-details">
          <div class="detail-item">
            <div class="detail-label">Type</div>
            <div class="detail-value">${instance.type}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">IP Publique</div>
            <div class="detail-value monospace">${instance.publicIp}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">IP Privée</div>
            <div class="detail-value monospace">${instance.privateIp}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Zone</div>
            <div class="detail-value">${instance.availabilityZone}</div>
          </div>
        </div>
        
        <div class="instance-actions">
          ${getActionButtons(instance)}
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners to action buttons
  attachActionListeners();
}

function getStatusClass(state) {
  const stateMap = {
    'running': 'status-running',
    'stopped': 'status-stopped',
    'pending': 'status-pending',
    'stopping': 'status-stopping',
    'terminated': 'status-stopped'
  };
  return stateMap[state] || 'status-pending';
}

function getStatusText(state) {
  const textMap = {
    'running': 'En cours',
    'stopped': 'Arrêté',
    'pending': 'En attente',
    'stopping': 'Arrêt en cours',
    'terminated': 'Terminé'
  };
  return textMap[state] || state;
}

function getActionButtons(instance) {
  const buttons = [];
  
  if (instance.state === 'stopped') {
    buttons.push(`
      <button class="btn btn-success btn-sm" onclick="startInstance('${instance.id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
        </svg>
        Démarrer
      </button>
    `);
  }
  
  if (instance.state === 'running') {
    buttons.push(`
      <button class="btn btn-danger btn-sm" onclick="stopInstance('${instance.id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="3" y="3" width="6" height="6" fill="currentColor"/>
        </svg>
        Arrêter
      </button>
    `);
    
    buttons.push(`
      <button class="btn btn-secondary btn-sm" onclick="rebootInstance('${instance.id}')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M10 6c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c1 0 1.9.3 2.7.9M10 2v2.5h-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Redémarrer
      </button>
    `);
  }
  
  buttons.push(`
    <button class="btn btn-secondary btn-sm" onclick="viewDetails('${instance.id}')">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M1 6s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3z" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      Détails
    </button>
  `);
  
  return buttons.join('');
}

function attachActionListeners() {
  // Event listeners are already attached via onclick in the HTML
  // This function is kept for future improvements
}

// Instance Actions
async function startInstance(instanceId) {
  const instance = instances.find(i => i.id === instanceId);
  if (!instance) return;
  
  const confirmed = confirm(`Voulez-vous démarrer l'instance "${instance.name}" (${instanceId}) ?`);
  if (!confirmed) return;
  
  try {
    showToast(`Démarrage de l'instance ${instance.name}...`, 'info');
    
    const response = await fetch(`${API_BASE_URL}/api/instances/${instanceId}/start`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du démarrage');
    }
    
    showToast(`Instance ${instance.name} démarrée avec succès`, 'success');
    
    // Reload instances after a delay
    setTimeout(() => loadInstances(), 2000);
  } catch (error) {
    console.error('Error starting instance:', error);
    showToast(error.message, 'error');
  }
}

async function stopInstance(instanceId) {
  const instance = instances.find(i => i.id === instanceId);
  if (!instance) return;
  
  const confirmed = confirm(`Voulez-vous arrêter l'instance "${instance.name}" (${instanceId}) ?`);
  if (!confirmed) return;
  
  try {
    showToast(`Arrêt de l'instance ${instance.name}...`, 'info');
    
    const response = await fetch(`${API_BASE_URL}/api/instances/${instanceId}/stop`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'arrêt');
    }
    
    showToast(`Instance ${instance.name} arrêtée avec succès`, 'success');
    
    // Reload instances after a delay
    setTimeout(() => loadInstances(), 2000);
  } catch (error) {
    console.error('Error stopping instance:', error);
    showToast(error.message, 'error');
  }
}

async function rebootInstance(instanceId) {
  const instance = instances.find(i => i.id === instanceId);
  if (!instance) return;
  
  const confirmed = confirm(`Voulez-vous redémarrer l'instance "${instance.name}" (${instanceId}) ?`);
  if (!confirmed) return;
  
  try {
    showToast(`Redémarrage de l'instance ${instance.name}...`, 'info');
    
    const response = await fetch(`${API_BASE_URL}/api/instances/${instanceId}/reboot`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du redémarrage');
    }
    
    showToast(`Instance ${instance.name} redémarrée avec succès`, 'success');
    
    // Reload instances after a delay
    setTimeout(() => loadInstances(), 2000);
  } catch (error) {
    console.error('Error rebooting instance:', error);
    showToast(error.message, 'error');
  }
}

async function viewDetails(instanceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/instances/${instanceId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du chargement des détails');
    }
    
    const instance = data.instance;
    
    elements.modalBody.innerHTML = `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <h4 style="margin-bottom: 0.5rem; color: var(--gray-700);">Informations générales</h4>
          <div style="display: grid; gap: 0.75rem;">
            <div><strong>Nom:</strong> ${instance.name}</div>
            <div><strong>ID:</strong> <code>${instance.id}</code></div>
            <div><strong>État:</strong> <span class="instance-status ${getStatusClass(instance.state)}">${getStatusText(instance.state)}</span></div>
            <div><strong>Type:</strong> ${instance.type}</div>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 0.5rem; color: var(--gray-700);">Réseau</h4>
          <div style="display: grid; gap: 0.75rem;">
            <div><strong>IP Publique:</strong> <code>${instance.publicIp}</code></div>
            <div><strong>IP Privée:</strong> <code>${instance.privateIp}</code></div>
            <div><strong>VPC:</strong> <code>${instance.vpcId || 'N/A'}</code></div>
            <div><strong>Subnet:</strong> <code>${instance.subnetId || 'N/A'}</code></div>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 0.5rem; color: var(--gray-700);">Localisation</h4>
          <div style="display: grid; gap: 0.75rem;">
            <div><strong>Zone de disponibilité:</strong> ${instance.availabilityZone}</div>
            <div><strong>Date de lancement:</strong> ${new Date(instance.launchTime).toLocaleString('fr-FR')}</div>
          </div>
        </div>
        
        ${instance.tags && instance.tags.length > 0 ? `
          <div>
            <h4 style="margin-bottom: 0.5rem; color: var(--gray-700);">Tags</h4>
            <div style="display: grid; gap: 0.5rem;">
              ${instance.tags.map(tag => `
                <div style="padding: 0.5rem; background: var(--gray-100); border-radius: 4px;">
                  <strong>${tag.Key}:</strong> ${tag.Value}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    openModal();
  } catch (error) {
    console.error('Error loading instance details:', error);
    showToast(error.message, 'error');
  }
}

// Modal functions
function openModal() {
  elements.instanceModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  elements.instanceModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  
  toast.innerHTML = `
    <div style="font-size: 1.25rem;">${icon}</div>
    <div style="flex: 1;">${message}</div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Update last update time
function updateLastUpdate() {
  const now = new Date();
  elements.lastUpdate.textContent = now.toLocaleTimeString('fr-FR');
}

// Setup event listeners
function setupEventListeners() {
  // Refresh button
  elements.refreshBtn.addEventListener('click', () => {
    loadInstances();
  });
  
  // Filters
  elements.stateFilter.addEventListener('change', applyFilters);
  elements.searchInput.addEventListener('input', applyFilters);
  
  // Close modal on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.instanceModal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadInstances();
  }, 30000);
}

// Make functions globally available
window.startInstance = startInstance;
window.stopInstance = stopInstance;
window.rebootInstance = rebootInstance;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.loadInstances = loadInstances;

console.log('✅ EC2 Manager initialized successfully');
