/* ========================================
   ONE ROOF - RENOVATION PROJECT MANAGER
   Backend Server with SQLite
   ======================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite database
const db = new Database('renovation.db');

// ========================================
// DATABASE INITIALIZATION
// ========================================

function initializeDatabase() {
    // Create projects table
    db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            budget REAL NOT NULL,
            description TEXT,
            createdAt TEXT NOT NULL
        )
    `);

    // Create expenses table
    db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);

    // Create tasks table
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            notes TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);

    console.log('✅ Database initialized successfully');
}

// ========================================
// API ROUTES - PROJECTS
// ========================================

// Get all projects
app.get('/api/projects', (req, res) => {
    try {
        const projects = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all();

        // For each project, get its expenses and tasks
        const projectsWithData = projects.map(project => {
            const expenses = db.prepare('SELECT * FROM expenses WHERE projectId = ?').all(project.id);
            const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(project.id);

            return {
                ...project,
                expenses,
                tasks
            };
        });

        res.json(projectsWithData);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
    try {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const expenses = db.prepare('SELECT * FROM expenses WHERE projectId = ?').all(project.id);
        const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(project.id);

        res.json({
            ...project,
            expenses,
            tasks
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create project
app.post('/api/projects', (req, res) => {
    try {
        const { id, name, budget, description, createdAt } = req.body;

        const stmt = db.prepare(`
            INSERT INTO projects (id, name, budget, description, createdAt)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(id, name, budget, description || '', createdAt);

        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        res.status(201).json({ ...project, expenses: [], tasks: [] });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
    try {
        // Delete related expenses and tasks first
        db.prepare('DELETE FROM expenses WHERE projectId = ?').run(req.params.id);
        db.prepare('DELETE FROM tasks WHERE projectId = ?').run(req.params.id);

        // Delete project
        const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// ========================================
// API ROUTES - EXPENSES
// ========================================

// Get expenses for a project
app.get('/api/projects/:projectId/expenses', (req, res) => {
    try {
        const expenses = db.prepare('SELECT * FROM expenses WHERE projectId = ?').all(req.params.projectId);
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Create expense
app.post('/api/projects/:projectId/expenses', (req, res) => {
    try {
        const { id, name, amount, category, date, createdAt } = req.body;
        const { projectId } = req.params;

        const stmt = db.prepare(`
            INSERT INTO expenses (id, projectId, name, amount, category, date, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(id, projectId, name, amount, category, date, createdAt);

        const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
        res.status(201).json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// ========================================
// API ROUTES - TASKS
// ========================================

// Get tasks for a project
app.get('/api/projects/:projectId/tasks', (req, res) => {
    try {
        const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(req.params.projectId);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create task
app.post('/api/projects/:projectId/tasks', (req, res) => {
    try {
        const { id, name, status, priority, notes, createdAt } = req.body;
        const { projectId } = req.params;

        const stmt = db.prepare(`
            INSERT INTO tasks (id, projectId, name, status, priority, notes, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(id, projectId, name, status, priority, notes || '', createdAt);

        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    try {
        const { status, name, priority, notes } = req.body;
        const { id } = req.params;

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// ========================================
// MIGRATION ENDPOINT - Import from localStorage
// ========================================

app.post('/api/migrate', (req, res) => {
    try {
        const { projects } = req.body;

        if (!projects || !Array.isArray(projects)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        let imported = 0;

        // Use transaction for data consistency
        const migrate = db.transaction((projects) => {
            for (const project of projects) {
                // Insert project
                const projectStmt = db.prepare(`
                    INSERT OR REPLACE INTO projects (id, name, budget, description, createdAt)
                    VALUES (?, ?, ?, ?, ?)
                `);
                projectStmt.run(project.id, project.name, project.budget, project.description || '', project.createdAt);

                // Insert expenses
                if (project.expenses && project.expenses.length > 0) {
                    const expenseStmt = db.prepare(`
                        INSERT OR REPLACE INTO expenses (id, projectId, name, amount, category, date, createdAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    for (const expense of project.expenses) {
                        expenseStmt.run(
                            expense.id,
                            project.id,
                            expense.name,
                            expense.amount,
                            expense.category,
                            expense.date,
                            expense.createdAt
                        );
                    }
                }

                // Insert tasks
                if (project.tasks && project.tasks.length > 0) {
                    const taskStmt = db.prepare(`
                        INSERT OR REPLACE INTO tasks (id, projectId, name, status, priority, notes, createdAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    for (const task of project.tasks) {
                        taskStmt.run(
                            task.id,
                            project.id,
                            task.name,
                            task.status,
                            task.priority,
                            task.notes || '',
                            task.createdAt
                        );
                    }
                }

                imported++;
            }
        });

        migrate(projects);

        res.json({
            message: 'Migration completed successfully',
            imported
        });
    } catch (error) {
        console.error('Error during migration:', error);
        res.status(500).json({ error: 'Migration failed' });
    }
});

// ========================================
// START SERVER
// ========================================

initializeDatabase();

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   ONE ROOF - Renovation Manager Server    ║
║                                            ║
║   🚀 Server running on port ${PORT}          ║
║   📁 Database: renovation.db               ║
║   🌐 http://localhost:${PORT}                ║
╚════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
});
