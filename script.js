(() => {
  'use strict';

  const STORAGE_KEY = 'ec2-console-credentials';
  const FILTER_KEY = 'ec2-console-last-filters';
  const STATE_ORDER = {
    running: 0,
    pending: 1,
    stopping: 2,
    stopped: 3,
    'shutting-down': 4,
    terminated: 5,
    unknown: 6
  };

  const state = {
    awsReady: false,
    ec2: null,
    isFetching: false,
    lastQuery: null
  };

  const elements = {
    inputs: {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    cacheDom();

    if (!window.AWS) {
      disableInteraction();
      setFeedback("SDK AWS introuvable. Vérifiez l'inclusion de la bibliothèque.", 'error');
      return;
    }

    attachEventListeners();
    renderPlaceholder();
    restoreLastFilters();
    restorePersistedCredentials();
  }

  function cacheDom() {
    elements.credentialsForm = document.getElementById('credentialsForm');
    elements.filtersForm = document.getElementById('filtersForm');
    elements.resetCredentials = document.getElementById('resetCredentials');
    elements.listButton = document.getElementById('listInstances');
    elements.refreshButton = document.getElementById('refreshInstances');
    elements.feedback = document.getElementById('feedback');
    elements.tableBody = document.getElementById('instancesTableBody');
    elements.persistSession = document.getElementById('persistSession');
    elements.helpButton = document.getElementById('openHelp');
    elements.helpDialog = document.getElementById('helpDialog');

    elements.inputs.accessKeyId = document.getElementById('accessKeyId');
    elements.inputs.secretAccessKey = document.getElementById('secretAccessKey');
    elements.inputs.sessionToken = document.getElementById('sessionToken');
    elements.inputs.region = document.getElementById('region');
    elements.inputs.instanceId = document.getElementById('instanceId');
    elements.inputs.tagKey = document.getElementById('tagKey');
    elements.inputs.tagValue = document.getElementById('tagValue');
    elements.inputs.state = document.getElementById('state');
  }

  function attachEventListeners() {
    elements.credentialsForm?.addEventListener('submit', onCredentialsSubmit);
    elements.resetCredentials?.addEventListener('click', onResetCredentials);
    elements.filtersForm?.addEventListener('submit', onFiltersSubmit);
    elements.refreshButton?.addEventListener('click', () => {
      if (state.lastQuery) {
        runQuery(state.lastQuery, { trigger: 'refresh', silent: true });
      }
    });
    elements.tableBody?.addEventListener('click', onTableActionClick);
    elements.helpButton?.addEventListener('click', openHelpDialog);

    elements.persistSession?.addEventListener('change', (event) => {
      if (!event.target.checked) {
        removeStoredCredentials();
        setFeedback('Les identifiants ont été retirés du stockage local.', 'info');
      }
    });
  }

  async function onCredentialsSubmit(event) {
    event.preventDefault();
    clearFeedback();

    const credentials = collectCredentialsFromForm();
    const persist = Boolean(elements.persistSession?.checked);

    try {
      const sanitized = await initializeAwsSession(credentials, { silent: false });
      if (persist) {
        storeCredentials(sanitized);
      } else {
        removeStoredCredentials();
      }
      setFeedback('SDK AWS initialisé. Lancez la recherche de vos instances.', 'success');
    } catch (error) {
      setFeedback(formatError(error, "Impossible d'initialiser le SDK AWS."), 'error');
    }
  }

  async function restorePersistedCredentials() {
    const stored = readStoredCredentials();
    if (!stored) {
      disableQuerying();
      return;
    }

    fillCredentialFields(stored);
    if (elements.persistSession) {
      elements.persistSession.checked = true;
    }

    try {
      setFeedback('Initialisation automatique avec les identifiants mémorisés...', 'info');
      await initializeAwsSession(stored, { silent: true });
      storeCredentials(stored); // rafraîchit la date de persistance
      setFeedback('SDK AWS initialisé à partir des identifiants mémorisés. Vérifiez vos filtres avant de lancer la recherche.', 'success');
    } catch (error) {
      removeStoredCredentials();
      disableQuerying();
      setFeedback(formatError(error, 'Impossible de restaurer les identifiants mémorisés.'), 'error');
    }
  }

  function fillCredentialFields(credentials) {
    if (elements.inputs.accessKeyId) {
      elements.inputs.accessKeyId.value = credentials.accessKeyId ?? '';
    }
    if (elements.inputs.secretAccessKey) {
      elements.inputs.secretAccessKey.value = credentials.secretAccessKey ?? '';
    }
    if (elements.inputs.sessionToken) {
      elements.inputs.sessionToken.value = credentials.sessionToken ?? '';
    }
    if (elements.inputs.region) {
      elements.inputs.region.value = credentials.region ?? '';
    }
  }

  function collectCredentialsFromForm() {
    return {
      accessKeyId: elements.inputs.accessKeyId?.value ?? '',
      secretAccessKey: elements.inputs.secretAccessKey?.value ?? '',
      sessionToken: elements.inputs.sessionToken?.value ?? '',
      region: elements.inputs.region?.value ?? ''
    };
  }

  function collectFiltersFromForm() {
    return {
      instanceId: elements.inputs.instanceId?.value ?? '',
      tagKey: elements.inputs.tagKey?.value ?? '',
      tagValue: elements.inputs.tagValue?.value ?? '',
      state: elements.inputs.state?.value ?? 'all'
    };
  }

  async function onFiltersSubmit(event) {
    event.preventDefault();
    if (!state.awsReady) {
      setFeedback('Initialisez d’abord le SDK AWS avec vos identifiants.', 'error');
      return;
    }

    const filters = collectFiltersFromForm();
    runQuery(filters, { trigger: 'list', storeFilters: true });
  }

  async function runQuery(rawFilters, options = {}) {
    if (!state.awsReady || !state.ec2 || state.isFetching) {
      return;
    }

    const { trigger = 'list', silent = false, storeFilters = false } = options;
    const filters = sanitizeFilters(rawFilters);

    state.isFetching = true;
    setQueryLoading(true, trigger);
    if (!silent) {
      setFeedback('Recherche des instances en cours...', 'info');
    }

    try {
      const params = buildDescribeParams(filters);
      const instances = await fetchInstances(params);
      state.lastQuery = filters;
      if (storeFilters) {
        persistFilters(filters);
      }

      renderInstances(instances);
      if (instances.length) {
        setFeedback(`Résultat : ${instances.length} instance${instances.length > 1 ? 's' : ''} trouvée${instances.length > 1 ? 's' : ''}.`, 'success');
      } else {
        setFeedback('Aucune instance ne correspond aux filtres fournis.', 'info');
      }
    } catch (error) {
      renderPlaceholder('Une erreur est survenue lors de la récupération des instances.');
      setFeedback(formatError(error, 'Impossible de récupérer les instances EC2.'), 'error');
    } finally {
      state.isFetching = false;
      setQueryLoading(false, trigger);
    }
  }

  function onTableActionClick(event) {
    const button = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
    if (!button) {
      return;
    }

    const { action, instanceId } = button.dataset;
    if (!action || !instanceId) {
      return;
    }

    if (!state.awsReady || !state.ec2) {
      setFeedback('Initialisez d’abord le SDK AWS avec vos identifiants.', 'error');
      return;
    }

    changeInstanceState(action, instanceId, button.closest('tr'));
  }

  async function changeInstanceState(action, instanceId, row) {
    const validActions = ['start', 'stop'];
    if (!validActions.includes(action)) {
      return;
    }

    const verbs = {
      start: { label: 'Démarrage', api: 'startInstances' },
      stop: { label: 'Arrêt', api: 'stopInstances' }
    };

    const descriptor = verbs[action];
    setFeedback(`${descriptor.label} de ${instanceId} en cours...`, 'info');

    const buttons = row?.querySelectorAll('button[data-action]');
    buttons?.forEach((btn) => {
      btn.disabled = true;
    });

    try {
      await state.ec2[descriptor.api]({ InstanceIds: [instanceId] }).promise();
      setFeedback(`Commande ${descriptor.api} envoyée à ${instanceId}.`, 'success');
    } catch (error) {
      setFeedback(formatError(error, `Impossible d'exécuter l'action sur ${instanceId}.`), 'error');
    } finally {
      buttons?.forEach((btn) => {
        btn.disabled = false;
      });
    }

    if (state.lastQuery) {
      runQuery(state.lastQuery, { trigger: 'refresh', silent: true });
    }
  }

  async function initializeAwsSession(rawCredentials, options = {}) {
    const { silent = false } = options;
    const credentials = sanitizeCredentials(rawCredentials);

    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
      throw new Error('Les champs ID de clé, clé secrète et région sont obligatoires.');
    }

    toggleCredentialsForm(true);

    try {
      if (!silent) {
        setFeedback('Initialisation du SDK AWS...', 'info');
      }

      const awsCredentials = new AWS.Credentials({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken || undefined
      });

      AWS.config.update({
        region: credentials.region,
        credentials: awsCredentials
      });

      await new Promise((resolve, reject) => {
        if (typeof AWS.config.credentials?.get === 'function') {
          AWS.config.credentials.get((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });

      state.awsReady = true;
      state.ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
      state.lastQuery = null;
      enableQuerying();

      return credentials;
    } catch (error) {
      state.awsReady = false;
      state.ec2 = null;
      disableQuerying();
      throw error;
    } finally {
      toggleCredentialsForm(false);
    }
  }

  function buildDescribeParams(filters) {
    const params = {};

    if (filters.instanceIds.length) {
      params.InstanceIds = filters.instanceIds;
    }

    const awsFilters = [];

    if (!filters.instanceIds.length) {
      if (filters.tagKey && filters.tagValue) {
        awsFilters.push({ Name: `tag:${filters.tagKey}`, Values: [filters.tagValue] });
      } else if (filters.tagKey) {
        awsFilters.push({ Name: 'tag-key', Values: [filters.tagKey] });
      } else if (filters.tagValue) {
        awsFilters.push({ Name: 'tag-value', Values: [filters.tagValue] });
      }

      if (filters.state && filters.state !== 'all') {
        awsFilters.push({ Name: 'instance-state-name', Values: [filters.state] });
      }
    }

    if (awsFilters.length) {
      params.Filters = awsFilters;
    }

    return params;
  }

  async function fetchInstances(params) {
    const instances = [];
    let nextToken;

    do {
      const response = await state.ec2.describeInstances({ ...params, NextToken: nextToken }).promise();
      const reservations = response.Reservations ?? [];

      reservations.forEach((reservation) => {
        const resInstances = reservation.Instances ?? [];
        resInstances.forEach((instance) => {
          instances.push(transformInstance(instance));
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return instances.sort(sortInstances);
  }

  function transformInstance(instance) {
    const nameTag = (instance.Tags || []).find((tag) => tag.Key === 'Name');
    const otherTags = (instance.Tags || []).filter((tag) => tag.Key !== 'Name');
    const tagFragments = otherTags.slice(0, 2).map((tag) => `${tag.Key}=${tag.Value}`);
    if (otherTags.length > 2) {
      tagFragments.push(`+${otherTags.length - 2} tags`);
    }

    const metaFragments = [];
    if (tagFragments.length) {
      metaFragments.push(tagFragments.join(' · '));
    }
    if (instance.PublicIpAddress) {
      metaFragments.push(`IP ${instance.PublicIpAddress}`);
    }

    const launchTime = instance.LaunchTime instanceof Date ? instance.LaunchTime : instance.LaunchTime ? new Date(instance.LaunchTime) : null;

    return {
      id: instance.InstanceId,
      name: nameTag?.Value ?? '—',
      type: instance.InstanceType ?? '—',
      state: (instance.State?.Name ?? 'unknown').toLowerCase(),
      zone: instance.Placement?.AvailabilityZone ?? '—',
      launchTime,
      meta: metaFragments.join(' · '),
      canStart: (instance.State?.Name ?? '').toLowerCase() === 'stopped',
      canStop: (instance.State?.Name ?? '').toLowerCase() === 'running'
    };
  }

  function sortInstances(a, b) {
    const stateWeightA = STATE_ORDER[a.state] ?? STATE_ORDER.unknown;
    const stateWeightB = STATE_ORDER[b.state] ?? STATE_ORDER.unknown;

    if (stateWeightA !== stateWeightB) {
      return stateWeightA - stateWeightB;
    }

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.id.localeCompare(b.id);
  }

  function renderInstances(instances) {
    if (!elements.tableBody) {
      return;
    }

    elements.tableBody.innerHTML = '';

    if (!instances.length) {
      renderPlaceholder('Aucune instance à afficher. Ajustez vos filtres et réessayez.');
      return;
    }

    instances.forEach((instance) => {
      const row = document.createElement('tr');
      row.dataset.instanceId = instance.id;

      const nameCell = document.createElement('td');
      const name = document.createElement('span');
      name.className = 'instance-name';
      name.textContent = instance.name;
      nameCell.appendChild(name);

      if (instance.meta) {
        const meta = document.createElement('span');
        meta.className = 'instance-meta';
        meta.textContent = instance.meta;
        nameCell.appendChild(meta);
      }

      const idCell = document.createElement('td');
      idCell.textContent = instance.id;

      const typeCell = document.createElement('td');
      typeCell.textContent = instance.type;

      const zoneCell = document.createElement('td');
      zoneCell.textContent = instance.zone;

      const stateCell = document.createElement('td');
      const stateBadge = document.createElement('span');
      stateBadge.className = `instance-state ${cssSafe(instance.state)}`;
      stateBadge.textContent = instance.state;
      stateCell.appendChild(stateBadge);

      const launchCell = document.createElement('td');
      launchCell.textContent = formatDate(instance.launchTime);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'instances-actions';

      const startButton = document.createElement('button');
      startButton.type = 'button';
      startButton.className = 'action-start';
      startButton.dataset.action = 'start';
      startButton.dataset.instanceId = instance.id;
      startButton.textContent = 'Start';
      startButton.disabled = !instance.canStart;

      const stopButton = document.createElement('button');
      stopButton.type = 'button';
      stopButton.className = 'action-stop';
      stopButton.dataset.action = 'stop';
      stopButton.dataset.instanceId = instance.id;
      stopButton.textContent = 'Stop';
      stopButton.disabled = !instance.canStop;

      actionsCell.append(startButton, stopButton);

      row.append(nameCell, idCell, typeCell, zoneCell, stateCell, launchCell, actionsCell);
      elements.tableBody.appendChild(row);
    });

    if (elements.refreshButton) {
      elements.refreshButton.disabled = !state.lastQuery;
    }
  }

  function renderPlaceholder(message) {
    if (!elements.tableBody) {
      return;
    }

    elements.tableBody.innerHTML = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.className = 'empty';
    cell.textContent = message || "Initialisez l'accès AWS puis lancez une recherche pour afficher vos instances.";
    row.appendChild(cell);
    elements.tableBody.appendChild(row);
  }

  function formatDate(date) {
    if (!date) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium'
      }).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  function sanitizeCredentials(credentials) {
    return {
      accessKeyId: (credentials.accessKeyId || '').trim(),
      secretAccessKey: (credentials.secretAccessKey || '').trim(),
      sessionToken: (credentials.sessionToken || '').trim(),
      region: (credentials.region || '').trim()
    };
  }

  function sanitizeFilters(filters) {
    const instanceIds = (filters.instanceId || '')
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      instanceIds,
      tagKey: (filters.tagKey || '').trim(),
      tagValue: (filters.tagValue || '').trim(),
      state: (filters.state || 'all').trim().toLowerCase()
    };
  }

  function setFeedback(message = '', type = 'info') {
    if (!elements.feedback) {
      return;
    }

    elements.feedback.className = message ? `feedback ${type}` : 'feedback';
    elements.feedback.textContent = message;
  }

  function clearFeedback() {
    if (!elements.feedback) {
      return;
    }
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
  }

  function toggleCredentialsForm(isLoading) {
    const form = elements.credentialsForm;
    if (!form) {
      return;
    }

    const interactive = form.querySelectorAll('input, button, select');
    interactive.forEach((element) => {
      element.disabled = isLoading;
    });

    if (elements.resetCredentials) {
      elements.resetCredentials.disabled = isLoading;
    }
  }

  function enableQuerying() {
    if (elements.listButton) {
      elements.listButton.disabled = !state.awsReady;
      if (!state.awsReady) {
        elements.listButton.textContent = 'Liste des instances';
      }
    }
    if (elements.refreshButton) {
      elements.refreshButton.disabled = !state.lastQuery;
      elements.refreshButton.textContent = 'Rafraîchir';
    }
  }

  function disableQuerying() {
    if (elements.listButton) {
      elements.listButton.disabled = true;
      elements.listButton.textContent = 'Liste des instances';
    }
    if (elements.refreshButton) {
      elements.refreshButton.disabled = true;
      elements.refreshButton.textContent = 'Rafraîchir';
    }
  }

  function setQueryLoading(isLoading, trigger) {
    if (elements.listButton) {
      elements.listButton.disabled = isLoading || !state.awsReady;
      elements.listButton.textContent = isLoading && trigger === 'list' ? 'Chargement...' : 'Liste des instances';
    }
    if (elements.refreshButton) {
      elements.refreshButton.disabled = isLoading || !state.lastQuery;
      elements.refreshButton.textContent = isLoading && trigger === 'refresh' ? 'Rafraîchissement...' : 'Rafraîchir';
    }
  }

  function disableInteraction() {
    elements.credentialsForm?.querySelectorAll('input, button').forEach((el) => {
      el.disabled = true;
    });
    disableQuerying();
  }

  function storeCredentials(credentials) {
    try {
      const payload = {
        ...credentials,
        persistedAt: new Date().toISOString(),
        autoInit: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Impossible de stocker les identifiants :', error);
    }
  }

  function readStoredCredentials() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return sanitizeCredentials(JSON.parse(raw));
    } catch (error) {
      console.warn('Impossible de lire les identifiants stockés :', error);
      return null;
    }
  }

  function removeStoredCredentials() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Impossible de supprimer les identifiants stockés :', error);
    }
  }

  function persistFilters(filters) {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Impossible de stocker les filtres :', error);
    }
  }

  function restoreLastFilters() {
    try {
      const raw = sessionStorage.getItem(FILTER_KEY);
      if (!raw) {
        return;
      }
      const filters = JSON.parse(raw);

      if (elements.inputs.instanceId) {
        elements.inputs.instanceId.value = (filters.instanceIds || []).join(', ');
      }
      if (elements.inputs.tagKey) {
        elements.inputs.tagKey.value = filters.tagKey ?? '';
      }
      if (elements.inputs.tagValue) {
        elements.inputs.tagValue.value = filters.tagValue ?? '';
      }
      if (elements.inputs.state && filters.state) {
        elements.inputs.state.value = filters.state;
      }
    } catch (error) {
      console.warn('Impossible de restaurer les filtres :', error);
    }
  }

  function onResetCredentials() {
    if (elements.credentialsForm) {
      elements.credentialsForm.reset();
    }
    state.awsReady = false;
    state.ec2 = null;
    state.lastQuery = null;
    removeStoredCredentials();
    disableQuerying();
    renderPlaceholder();
    setFeedback('Identifiants effacés. Saisissez-en de nouveaux pour continuer.', 'info');
  }

  function openHelpDialog() {
    if (!elements.helpDialog) {
      return;
    }

    if (typeof elements.helpDialog.showModal === 'function') {
      elements.helpDialog.showModal();
    } else {
      alert('Pour utiliser cette application :\n1. Renseignez vos identifiants AWS.\n2. Configurez vos filtres.\n3. Lancez les actions Start/Stop.');
    }
  }

  function formatError(error, fallback) {
    if (!error) {
      return fallback;
    }

    const details = [];
    if (error.code) {
      details.push(error.code);
    }
    if (error.message) {
      details.push(error.message);
    }

    if (!details.length) {
      return fallback;
    }

    return `${fallback} (${details.join(' - ')})`;
  }

  function cssSafe(value) {
    return value.replace(/[^a-z0-9-]/gi, '-');
  }
})();
