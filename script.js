import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand
} from "https://cdn.jsdelivr.net/npm/@aws-sdk/client-ec2@3.654.0/+esm";

const credentialsForm = document.getElementById("credentialsForm");
const accessKeyInput = document.getElementById("accessKeyId");
const secretKeyInput = document.getElementById("secretAccessKey");
const sessionTokenInput = document.getElementById("sessionToken");
const regionInput = document.getElementById("region");
const tagFilterInput = document.getElementById("tagFilter");
const connectButton = document.getElementById("connectButton");
const credentialStatus = document.getElementById("credentialStatus");
const resetCredentialsButton = document.getElementById("resetCredentials");
const refreshButton = document.getElementById("refreshButton");

const instancesPlaceholder = document.getElementById("instancesPlaceholder");
const placeholderIcon = instancesPlaceholder.querySelector(".placeholder__icon");
const placeholderMessage = instancesPlaceholder.querySelector("p");
const tableWrapper = document.querySelector(".table-wrapper");
const instancesTableBody = document.getElementById("instancesTableBody");

const activityLog = document.getElementById("activityLog");
const clearLogButton = document.getElementById("clearLog");
const toast = document.getElementById("toast");

let ec2Client = null;
let isConnecting = false;
let isFetching = false;
let toastTimeoutId = null;

const PLACEHOLDER_ICONS = {
  info: "☁️",
  loading: "⏳",
  empty: "📭",
  error: "⚠️"
};

const STATE_LABELS = {
  pending: "Démarrage",
  running: "En fonctionnement",
  stopping: "Arrêt en cours",
  stopped: "Arrêtée",
  "shutting-down": "Extinction",
  terminated: "Supprimée",
  rebooting: "Redémarrage"
};

const STATE_VARIANTS = {
  running: "success",
  stopped: "idle",
  pending: "warning",
  stopping: "warning",
  "shutting-down": "warning",
  rebooting: "warning",
  terminated: "error"
};

function setCredentialStatus(state, label) {
  credentialStatus.textContent = label;
  credentialStatus.className = `status-badge status-badge--${state}`;
}

function setPlaceholder(state, message) {
  placeholderIcon.textContent = PLACEHOLDER_ICONS[state] || PLACEHOLDER_ICONS.info;
  placeholderMessage.textContent = message;
  instancesPlaceholder.dataset.state = state;
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.textContent = loadingText || button.textContent;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    const original = button.dataset.originalText;
    if (original) {
      button.textContent = original;
    }
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

function parseTagFilters(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return { filters: [], warnings: [] };
  }

  const segments = trimmed.split(",").map(segment => segment.trim()).filter(Boolean);
  const filters = [];
  const warnings = [];

  segments.forEach(segment => {
    const [rawKey, rawValues] = segment.split("=");
    const key = rawKey?.trim();
    const valueString = rawValues?.trim();

    if (!key || !valueString) {
      warnings.push(`Filtre ignoré (format attendu clé=valeur) : ${segment}`);
      return;
    }

    const values = valueString
      .split("|")
      .map(value => value.trim())
      .filter(Boolean);

    if (!values.length) {
      warnings.push(`Valeurs manquantes pour le filtre ${key}.`);
      return;
    }

    filters.push({
      Name: `tag:${key}`,
      Values: values
    });
  });

  return { filters, warnings };
}

function formatState(state) {
  if (!state) return "Inconnu";
  return STATE_LABELS[state] || state;
}

function getStateVariant(state) {
  return STATE_VARIANTS[state] || "idle";
}

function canStart(state) {
  return state === "stopped";
}

function canStop(state) {
  return state === "running";
}

function logActivity(message, level = "info") {
  if (!message) return;

  const placeholder = activityLog.querySelector(".log-placeholder");
  if (placeholder) {
    placeholder.remove();
  }

  const entry = document.createElement("div");
  entry.className = `log-entry log-entry--${level}`;

  const time = document.createElement("time");
  const now = new Date();
  time.className = "log-entry__time";
  time.dateTime = now.toISOString();
  time.textContent = now.toLocaleTimeString();

  const messageSpan = document.createElement("span");
  messageSpan.className = "log-entry__message";
  messageSpan.textContent = message;

  entry.append(time, messageSpan);
  activityLog.append(entry);
  activityLog.scrollTop = activityLog.scrollHeight;

  updateClearLogState();
}

function updateClearLogState() {
  const hasEntries = !!activityLog.querySelector(".log-entry");
  clearLogButton.disabled = !hasEntries;
}

function clearActivityLog() {
  activityLog.innerHTML = "";
  const placeholder = document.createElement("p");
  placeholder.className = "log-placeholder";
  placeholder.textContent = "En attente d'actions...";
  activityLog.append(placeholder);
  updateClearLogState();
}

function showToast(message, variant = "info") {
  if (!toast) return;

  toast.textContent = message;
  toast.dataset.variant = variant;
  toast.hidden = false;
  toast.classList.add("toast--visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.hidden = true;
  }, 4500);
}

function renderInstances(instances) {
  instancesTableBody.innerHTML = "";

  if (!instances.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  instances.forEach(instance => {
    const instanceId = instance.InstanceId || "N/A";
    const tags = instance.Tags || [];
    const nameTag = tags.find(tag => tag.Key === "Name");
    const name = nameTag?.Value || "—";
    const type = instance.InstanceType || "—";
    const availabilityZone = instance.Placement?.AvailabilityZone || "—";
    const state = instance.State?.Name || "unknown";
    const displayState = formatState(state);
    const stateVariant = getStateVariant(state);

    const row = document.createElement("tr");
    row.dataset.instanceId = instanceId;
    row.dataset.state = state;

    const idCell = document.createElement("td");
    idCell.textContent = instanceId;

    const nameCell = document.createElement("td");
    nameCell.textContent = name;

    const typeCell = document.createElement("td");
    typeCell.textContent = type;

    const zoneCell = document.createElement("td");
    zoneCell.textContent = availabilityZone;

    const stateCell = document.createElement("td");
    const stateChip = document.createElement("span");
    stateChip.className = `state-label state-label--${stateVariant}`;
    stateChip.textContent = displayState;
    stateCell.append(stateChip);

    const actionsCell = document.createElement("td");
    actionsCell.className = "col-actions";

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.className = "action-button action-button--start";
    startButton.dataset.action = "start";
    startButton.dataset.instanceId = instanceId;
    startButton.textContent = "Démarrer";
    startButton.disabled = !canStart(state);

    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "action-button action-button--stop";
    stopButton.dataset.action = "stop";
    stopButton.dataset.instanceId = instanceId;
    stopButton.textContent = "Arrêter";
    stopButton.disabled = !canStop(state);

    actionsCell.append(startButton, stopButton);

    row.append(idCell, nameCell, typeCell, zoneCell, stateCell, actionsCell);
    fragment.append(row);
  });

  instancesTableBody.append(fragment);
}

async function buildEc2Client(credentials) {
  return new EC2Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken || undefined
    }
  });
}

async function fetchInstances({ showLoading = true, throwOnError = false } = {}) {
  if (!ec2Client) {
    const error = new Error("Client AWS non initialisé");
    if (throwOnError) throw error;
    return [];
  }

  if (isFetching) {
    return [];
  }

  isFetching = true;
  refreshButton.disabled = true;

  const { filters, warnings } = parseTagFilters(tagFilterInput.value);
  warnings.forEach(warning => logActivity(warning, "warning"));

  if (showLoading) {
    tableWrapper.hidden = true;
    instancesPlaceholder.hidden = false;
    setPlaceholder("loading", "Récupération des instances en cours...");
  }

  if (!showLoading) {
    setButtonLoading(refreshButton, true, "Actualisation...");
  }

  try {
    const instances = [];
    let nextToken = undefined;

    do {
      const command = new DescribeInstancesCommand({
        Filters: filters,
        MaxResults: 50,
        NextToken: nextToken
      });

      const response = await ec2Client.send(command);
      const reservations = response.Reservations || [];

      reservations.forEach(reservation => {
        const reservationInstances = reservation.Instances || [];
        reservationInstances.forEach(instance => {
          instances.push(instance);
        });
      });

      nextToken = response.NextToken;
    } while (nextToken && instances.length < 200);

    if (!instances.length) {
      renderInstances([]);
      tableWrapper.hidden = true;
      instancesPlaceholder.hidden = false;
      setPlaceholder("empty", "Aucune instance ne correspond aux filtres fournis.");
      logActivity("Aucune instance renvoyée par l'API EC2.", "info");
    } else {
      renderInstances(instances);
      tableWrapper.hidden = false;
      instancesPlaceholder.hidden = true;
      logActivity(
        `${instances.length} instance${instances.length > 1 ? "s" : ""} récupérée${instances.length > 1 ? "s" : ""}.`,
        "success"
      );
    }

    return instances;
  } catch (error) {
    const message = error?.message || "Erreur inattendue lors de la récupération des instances.";
    setPlaceholder("error", "Impossible de récupérer les instances. Vérifiez vos autorisations.");
    tableWrapper.hidden = true;
    instancesPlaceholder.hidden = false;
    logActivity(`Erreur EC2 DescribeInstances : ${message}`, "error");
    showToast(message, "error");
    if (throwOnError) {
      throw error;
    }
    return [];
  } finally {
    isFetching = false;
    refreshButton.disabled = !ec2Client;
    setButtonLoading(refreshButton, false);
  }
}

async function performInstanceAction(instanceId, action, button) {
  if (!ec2Client || !instanceId) {
    showToast("Client AWS non initialisé.", "error");
    return;
  }

  const isStart = action === "start";
  const command = isStart
    ? new StartInstancesCommand({ InstanceIds: [instanceId] })
    : new StopInstancesCommand({ InstanceIds: [instanceId] });

  const actionLabel = isStart ? "démarrage" : "mise à l'arrêt";

  if (button) {
    setButtonLoading(button, true, isStart ? "Démarrage..." : "Arrêt...");
  }

  logActivity(`Envoi de la requête de ${actionLabel} pour ${instanceId}...`, "info");

  try {
    await ec2Client.send(command);
    logActivity(`Commande ${actionLabel} envoyée pour ${instanceId}.`, "success");
    showToast(`Commande ${actionLabel} envoyée à ${instanceId}.`, "success");
    await fetchInstances({ showLoading: false });
  } catch (error) {
    const message = error?.message || "Erreur inattendue";
    logActivity(`Erreur lors de la commande ${actionLabel} pour ${instanceId} : ${message}`, "error");
    showToast(message, "error");
  } finally {
    if (button) {
      setButtonLoading(button, false);
    }
  }
}

async function handleCredentialsSubmit(event) {
  event.preventDefault();

  if (isConnecting) {
    return;
  }

  const accessKeyId = accessKeyInput.value.trim();
  const secretAccessKey = secretKeyInput.value.trim();
  const sessionToken = sessionTokenInput.value.trim();
  const region = regionInput.value.trim();

  if (!accessKeyId || !secretAccessKey || !region) {
    showToast("Veuillez renseigner les champs obligatoires.", "warning");
    return;
  }

  isConnecting = true;
  setButtonLoading(connectButton, true, "Connexion...");
  setCredentialStatus("connecting", "Connexion en cours...");
  logActivity("Initialisation du client EC2...", "info");

  try {
    ec2Client = await buildEc2Client({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    });

    await fetchInstances({ showLoading: true, throwOnError: true });

    setCredentialStatus("success", "Connecté");
    resetCredentialsButton.disabled = false;
    refreshButton.disabled = false;
    showToast("Connexion établie avec succès.", "success");
    logActivity("Connexion établie avec AWS EC2.", "success");
  } catch (error) {
    ec2Client = null;
    const message = error?.message || "Impossible d'initialiser le client EC2.";
    setCredentialStatus("error", "Échec de la connexion");
    showToast(message, "error");
    logActivity(`Échec de la connexion : ${message}`, "error");
  } finally {
    isConnecting = false;
    setButtonLoading(connectButton, false);
  }
}

function resetCredentials() {
  credentialsForm.reset();
  ec2Client = null;
  setCredentialStatus("idle", "Déconnecté");
  resetCredentialsButton.disabled = true;
  refreshButton.disabled = true;
  setPlaceholder("info", "Initialisez le client AWS pour récupérer vos instances.");
  tableWrapper.hidden = true;
  instancesPlaceholder.hidden = false;
  instancesTableBody.innerHTML = "";
  logActivity("Identifiants réinitialisés. Les actions EC2 sont désactivées.", "info");
  showToast("Identifiants supprimés du navigateur.", "info");
}

function hideToast() {
  toast.classList.remove("toast--visible");
  toast.hidden = true;
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
}

credentialsForm.addEventListener("submit", handleCredentialsSubmit);

resetCredentialsButton.addEventListener("click", () => {
  resetCredentials();
});

refreshButton.addEventListener("click", () => {
  if (!ec2Client) {
    showToast("Initialisez d'abord le client AWS.", "warning");
    return;
  }
  fetchInstances({ showLoading: true });
});

instancesTableBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, instanceId } = button.dataset;
  if (!action || !instanceId) return;

  performInstanceAction(instanceId, action, button);
});

clearLogButton.addEventListener("click", () => {
  clearActivityLog();
  showToast("Journal effacé.", "info");
});

if (toast) {
  toast.addEventListener("click", hideToast);
}

// Initial UI state
setCredentialStatus("idle", "Déconnecté");
updateClearLogState();
setPlaceholder("info", "Initialisez le client AWS pour récupérer vos instances.");
