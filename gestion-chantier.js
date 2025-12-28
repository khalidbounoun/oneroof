/* ========================================
   RENOVATION PROJECT MANAGEMENT APP
   One Roof - Gestion de Chantier
   ======================================== */

// ========================================
// API CONFIGURATION
// ========================================

const API_URL = window.location.origin;

// ========================================
// DATA MODEL & STATE
// ========================================

let state = {
    projects: [],
    currentProjectId: null
};

// ========================================
// API FUNCTIONS
// ========================================

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========================================
// DATA SYNCHRONIZATION
// ========================================

async function loadFromServer() {
    try {
        const projects = await apiRequest('/api/projects');
        state.projects = projects;

        // Restore current project from localStorage if available
        const savedCurrentProjectId = localStorage.getItem('currentProjectId');
        if (savedCurrentProjectId && state.projects.find(p => p.id === savedCurrentProjectId)) {
            state.currentProjectId = savedCurrentProjectId;
        } else if (state.projects.length > 0) {
            state.currentProjectId = state.projects[0].id;
        }

        updateProjectSelector();
        if (state.currentProjectId) {
            updateDashboard();
        }
    } catch (error) {
        console.error('Failed to load data from server:', error);
        alert('Erreur de connexion au serveur. Veuillez vérifier que le serveur est démarré.');
    }
}

async function migrateFromLocalStorage() {
    const saved = localStorage.getItem('renovationProjects');
    if (!saved) return false;

    try {
        const oldState = JSON.parse(saved);
        if (!oldState.projects || oldState.projects.length === 0) return false;

        // Confirm migration with user
        if (!confirm(`Voulez-vous migrer ${oldState.projects.length} projet(s) depuis le stockage local vers la base de données ?`)) {
            return false;
        }

        await apiRequest('/api/migrate', {
            method: 'POST',
            body: JSON.stringify({ projects: oldState.projects })
        });

        // Clear localStorage after successful migration
        localStorage.removeItem('renovationProjects');

        alert('Migration réussie ! Vos données sont maintenant stockées de manière permanente sur le serveur.');

        // Reload data from server
        await loadFromServer();

        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        alert('Échec de la migration. Vos données locales sont préservées.');
        return false;
    }
}

// ========================================
// PROJECT MANAGEMENT
// ========================================

async function createProject(name, budget, description = '') {
    const project = {
        id: Date.now().toString(),
        name,
        budget: parseFloat(budget),
        description,
        createdAt: new Date().toISOString(),
        expenses: [],
        tasks: []
    };

    try {
        const created = await apiRequest('/api/projects', {
            method: 'POST',
            body: JSON.stringify(project)
        });

        state.projects.push(created);
        state.currentProjectId = created.id;

        // Save current project ID to localStorage for persistence across sessions
        localStorage.setItem('currentProjectId', created.id);

        updateProjectSelector();
        updateDashboard();
        return created;
    } catch (error) {
        alert('Erreur lors de la création du projet');
        throw error;
    }
}

function getCurrentProject() {
    return state.projects.find(p => p.id === state.currentProjectId);
}

async function deleteProject(projectId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
        return;
    }

    try {
        await apiRequest(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        state.projects = state.projects.filter(p => p.id !== projectId);

        if (state.currentProjectId === projectId) {
            state.currentProjectId = state.projects.length > 0 ? state.projects[0].id : null;
            localStorage.setItem('currentProjectId', state.currentProjectId || '');
        }

        updateProjectSelector();
        updateDashboard();
    } catch (error) {
        alert('Erreur lors de la suppression du projet');
        throw error;
    }
}

// ========================================
// EXPENSE MANAGEMENT
// ========================================

async function addExpense(name, amount, category, date) {
    const project = getCurrentProject();
    if (!project) return;

    const expense = {
        id: Date.now().toString(),
        name,
        amount: parseFloat(amount),
        category,
        date,
        createdAt: new Date().toISOString()
    };

    try {
        const created = await apiRequest(`/api/projects/${project.id}/expenses`, {
            method: 'POST',
            body: JSON.stringify(expense)
        });

        project.expenses.push(created);
        updateDashboard();
        return created;
    } catch (error) {
        alert('Erreur lors de l\'ajout de la dépense');
        throw error;
    }
}

async function deleteExpense(expenseId) {
    const project = getCurrentProject();
    if (!project) return;

    try {
        await apiRequest(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });

        project.expenses = project.expenses.filter(e => e.id !== expenseId);
        updateDashboard();
    } catch (error) {
        alert('Erreur lors de la suppression de la dépense');
        throw error;
    }
}

function getTotalExpenses() {
    const project = getCurrentProject();
    if (!project) return 0;
    return project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

// ========================================
// TASK MANAGEMENT
// ========================================

async function addTask(name, status, priority, notes = '') {
    const project = getCurrentProject();
    if (!project) return;

    const task = {
        id: Date.now().toString(),
        name,
        status,
        priority,
        notes,
        createdAt: new Date().toISOString()
    };

    try {
        const created = await apiRequest(`/api/projects/${project.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify(task)
        });

        project.tasks.push(created);
        updateDashboard();
        return created;
    } catch (error) {
        alert('Erreur lors de l\'ajout de la tâche');
        throw error;
    }
}

async function updateTaskStatus(taskId, newStatus) {
    const project = getCurrentProject();
    if (!project) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
        const updated = await apiRequest(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        task.status = updated.status;
        updateDashboard();
    } catch (error) {
        alert('Erreur lors de la mise à jour de la tâche');
        throw error;
    }
}

async function deleteTask(taskId) {
    const project = getCurrentProject();
    if (!project) return;

    try {
        await apiRequest(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        project.tasks = project.tasks.filter(t => t.id !== taskId);
        updateDashboard();
    } catch (error) {
        alert('Erreur lors de la suppression de la tâche');
        throw error;
    }
}

function getCompletedTasksCount() {
    const project = getCurrentProject();
    if (!project) return { completed: 0, total: 0 };

    const completed = project.tasks.filter(t => t.status === 'done').length;
    const total = project.tasks.length;
    return { completed, total };
}

// ========================================
// UI UPDATES
// ========================================

function updateProjectSelector() {
    const selector = document.getElementById('currentProject');
    selector.innerHTML = '<option value="">Sélectionner un projet...</option>';

    state.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        option.selected = project.id === state.currentProjectId;
        selector.appendChild(option);
    });

    // Show/hide dashboard based on project selection
    const hasProject = state.currentProjectId !== null;
    document.getElementById('statsGrid').style.display = hasProject ? 'grid' : 'none';
    document.querySelector('.content-grid').style.display = hasProject ? 'grid' : 'none';
}

function updateDashboard() {
    const project = getCurrentProject();

    if (!project) {
        // Reset dashboard
        document.getElementById('budgetTotal').textContent = '0 €';
        document.getElementById('expensesTotal').textContent = '0 €';
        document.getElementById('remainingBudget').textContent = '0 €';
        document.getElementById('tasksCompleted').textContent = '0/0';
        document.getElementById('budgetProgressFill').style.width = '0%';
        document.getElementById('budgetPercentage').textContent = '0%';
        renderExpenses([]);
        renderTasks([]);
        return;
    }

    // Update stats
    const totalExpenses = getTotalExpenses();
    const remaining = project.budget - totalExpenses;
    const percentage = project.budget > 0 ? (totalExpenses / project.budget * 100) : 0;
    const { completed, total } = getCompletedTasksCount();

    document.getElementById('budgetTotal').textContent = formatCurrency(project.budget);
    document.getElementById('expensesTotal').textContent = formatCurrency(totalExpenses);
    document.getElementById('remainingBudget').textContent = formatCurrency(remaining);
    document.getElementById('tasksCompleted').textContent = `${completed}/${total}`;

    // Update progress bar
    const progressFill = document.getElementById('budgetProgressFill');
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('budgetPercentage').textContent = `${percentage.toFixed(1)}%`;

    // Change color if over budget
    if (percentage > 100) {
        progressFill.classList.add('over-budget');
    } else {
        progressFill.classList.remove('over-budget');
    }

    // Render expenses and tasks
    renderExpenses(project.expenses);
    renderTasks(project.tasks);
}

function renderExpenses(expenses) {
    const container = document.getElementById('expensesList');

    if (expenses.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune dépense enregistrée</p>';
        return;
    }

    // Sort by date (newest first)
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(expense => `
        <div class="expense-item">
            <div class="expense-item__content">
                <div class="expense-item__name">${escapeHtml(expense.name)}</div>
                <div class="expense-item__meta">
                    <span class="expense-item__category">${getCategoryLabel(expense.category)}</span>
                    <span>${formatDate(expense.date)}</span>
                </div>
            </div>
            <div class="expense-item__amount">${formatCurrency(expense.amount)}</div>
            <div class="expense-item__actions">
                <button class="expense-item__delete" onclick="deleteExpense('${expense.id}')" title="Supprimer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderTasks(tasks, filter = 'all') {
    const container = document.getElementById('tasksList');

    // Filter tasks
    const filtered = filter === 'all'
        ? tasks
        : tasks.filter(t => t.status === filter);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune tâche trouvée</p>';
        return;
    }

    // Sort: in progress > todo > done
    const statusOrder = { 'inprogress': 1, 'todo': 2, 'done': 3 };
    const sorted = [...filtered].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    container.innerHTML = sorted.map(task => `
        <div class="task-item" data-status="${task.status}">
            <input
                type="checkbox"
                class="task-item__checkbox"
                ${task.status === 'done' ? 'checked' : ''}
                onchange="toggleTaskStatus('${task.id}')"
            >
            <div class="task-item__content">
                <div class="task-item__header">
                    <div class="task-item__name">${escapeHtml(task.name)}</div>
                    <span class="task-item__priority task-item__priority--${task.priority}">
                        ${getPriorityLabel(task.priority)}
                    </span>
                </div>
                ${task.notes ? `<div class="task-item__notes">${escapeHtml(task.notes)}</div>` : ''}
            </div>
            <div class="task-item__actions">
                <button class="task-item__delete" onclick="deleteTask('${task.id}')" title="Supprimer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleTaskStatus(taskId) {
    const project = getCurrentProject();
    if (!project) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (task) {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        updateTaskStatus(taskId, newStatus);
    }
}

// ========================================
// MODAL MANAGEMENT
// ========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Intl.DateFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(dateString));
}

function getCategoryLabel(category) {
    const labels = {
        'materiaux': 'Matériaux',
        'main-oeuvre': 'Main d\'œuvre',
        'equipement': 'Équipement',
        'services': 'Services',
        'autre': 'Autre'
    };
    return labels[category] || category;
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Basse',
        'medium': 'Moyenne',
        'high': 'Haute'
    };
    return labels[priority] || priority;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check for and migrate old localStorage data
    await migrateFromLocalStorage();

    // Load data from server
    await loadFromServer();

    // Project selector
    document.getElementById('currentProject').addEventListener('change', (e) => {
        state.currentProjectId = e.target.value || null;
        localStorage.setItem('currentProjectId', state.currentProjectId || '');
        updateDashboard();
    });

    // Add project button
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        openModal('projectModal');
    });

    // Project form
    document.getElementById('projectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('projectName').value;
        const budget = document.getElementById('projectBudget').value;
        const description = document.getElementById('projectDescription').value;

        await createProject(name, budget, description);

        // Reset form
        e.target.reset();
        closeModal('projectModal');
    });

    // Add expense button
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        if (!getCurrentProject()) {
            alert('Veuillez d\'abord créer ou sélectionner un projet');
            return;
        }
        // Set default date to today
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        openModal('expenseModal');
    });

    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('expenseName').value;
        const amount = document.getElementById('expenseAmount').value;
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;

        await addExpense(name, amount, category, date);

        // Reset form
        e.target.reset();
        closeModal('expenseModal');
    });

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        if (!getCurrentProject()) {
            alert('Veuillez d\'abord créer ou sélectionner un projet');
            return;
        }
        openModal('taskModal');
    });

    // Task form
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('taskName').value;
        const status = document.getElementById('taskStatus').value;
        const priority = document.getElementById('taskPriority').value;
        const notes = document.getElementById('taskNotes').value;

        await addTask(name, status, priority, notes);

        // Reset form
        e.target.reset();
        closeModal('taskModal');
    });

    // Task filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Filter tasks
            const filter = e.target.dataset.filter;
            const project = getCurrentProject();
            if (project) {
                renderTasks(project.tasks, filter);
            }
        });
    });

    // Modal close buttons
    document.getElementById('closeProjectModal').addEventListener('click', () => closeModal('projectModal'));
    document.getElementById('cancelProjectBtn').addEventListener('click', () => closeModal('projectModal'));

    document.getElementById('closeExpenseModal').addEventListener('click', () => closeModal('expenseModal'));
    document.getElementById('cancelExpenseBtn').addEventListener('click', () => closeModal('expenseModal'));

    document.getElementById('closeTaskModal').addEventListener('click', () => closeModal('taskModal'));
    document.getElementById('cancelTaskBtn').addEventListener('click', () => closeModal('taskModal'));

    // Close modal on overlay click
    document.querySelectorAll('.modal__overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    // Initial update
    updateProjectSelector();
    if (state.currentProjectId) {
        updateDashboard();
    }
});
