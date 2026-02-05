import Database from 'better-sqlite3'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

// ========================================
// Config
// ========================================

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'tasks.db')

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true })
}

// ========================================
// Types
// ========================================

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold'

export interface Task {
  id: string
  project?: string | null
  category: string
  summary: string
  description?: string
  status: TaskStatus
  created_at: number // unix timestamp ms
  completed_at?: number // unix timestamp ms
  reason?: string
  additional_comments?: string
}

export interface CreateTaskInput {
  id?: string // if not provided, auto-generate
  project?: string | null
  category: string
  summary: string
  description?: string
  status?: TaskStatus
  additional_comments?: string
}

export interface UpdateTaskInput {
  project?: string | null
  status?: TaskStatus
  completed_at?: number
  reason?: string
  additional_comments?: string
}

export interface TaskMetrics {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  completionRate: number // % of completed tasks
  failureRate: number // % of cancelled tasks
  last7Days: number
  last30Days: number
}

export interface User {
  id: string
  email: string
  name?: string
  provider: 'github' | 'google' | 'unknown'
  provider_id: string
  approved: boolean
  created_at: number
  role: 'admin' | 'user'
}

// ========================================
// Database Setup
// ========================================

let dbInstance: Database.Database | null = null

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project TEXT,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      reason TEXT,
      additional_comments TEXT
    )
  `)

  // Best-effort migration: ensure project column exists on existing DBs
  try {
    db.exec('ALTER TABLE tasks ADD COLUMN project TEXT')
  } catch (err) {
    // ignore error if column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      approved BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `)

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)')
}

function getDb(): Database.Database {
  // Heal if a previous instance was closed for any reason
  const isOpen = (instance: Database.Database | null) => {
    if (!instance) return false
    // better-sqlite3 exposes `open` on the Database instance
    return (instance as unknown as { open?: boolean }).open !== false
  }

  if (!isOpen(dbInstance)) {
    dbInstance = new Database(DB_PATH)
    initTables(dbInstance)
    dbInstance.pragma('journal_mode = WAL')
  }

  return dbInstance as Database.Database
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ========================================
// Task CRUD Operations
// ========================================

export function createTask(input: CreateTaskInput): Task {
  const db = getDb()

  const id = input.id || generateId()
  const now = Date.now()
  const status = input.status || 'Not Started'

  const stmt = db.prepare(`
    INSERT INTO tasks (id, project, category, summary, description, status, created_at, completed_at, reason, additional_comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    input.project || null,
    input.category,
    input.summary,
    input.description || '',
    status,
    now,
    null, // completed_at
    null, // reason
    input.additional_comments || ''
  )

  // We know exactly what we just inserted, so construct the Task object directly
  const task: Task = {
    id,
    project: input.project || null,
    category: input.category,
    summary: input.summary,
    description: input.description || '',
    status,
    created_at: now,
    completed_at: undefined,
    reason: undefined,
    additional_comments: input.additional_comments || ''
  }

  return task
}

export function getTask(id: string): Task | undefined {
  const db = getDb()

  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?')
  const row = stmt.get(id) as any

  if (!row) return undefined

  return row as Task
}

export function listTasks(filters?: { status?: TaskStatus; category?: string; project?: string | null }): Task[] {
  const db = getDb()

  let query = 'SELECT * FROM tasks WHERE 1=1'
  const params: any[] = []

  if (filters?.status) {
    query += ` AND status = ?`
    params.push(filters.status)
  }

  if (filters?.category) {
    query += ` AND category = ?`
    params.push(filters.category)
  }

  if (filters?.project) {
    query += ` AND project = ?`
    params.push(filters.project)
  }

  query += ' ORDER BY created_at DESC'

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as any[]

  return rows as Task[]
}

export function updateTask(id: string, input: UpdateTaskInput): Task | undefined {
  const db = getDb()

  const existing = getTask(id)
  if (!existing) {
    return undefined
  }

  const updates: string[] = []
  const params: any[] = []

  if (input.status !== undefined) {
    updates.push('status = ?')
    params.push(input.status)

    // Auto-set completed_at when status becomes Completed
    if (input.status === 'Completed' && !input.completed_at) {
      updates.push('completed_at = ?')
      params.push(Date.now())
    } else if (input.status !== 'Completed') {
      updates.push('completed_at = ?')
      params.push(null)
    }
  }

  if (input.project !== undefined) {
    updates.push('project = ?')
    params.push(input.project)
  }

  if (input.completed_at !== undefined) {
    updates.push('completed_at = ?')
    params.push(input.completed_at)
  }

  if (input.reason !== undefined) {
    updates.push('reason = ?')
    params.push(input.reason)
  }

  if (input.additional_comments !== undefined) {
    updates.push('additional_comments = ?')
    params.push(input.additional_comments)
  }

  if (updates.length === 0) {
    return existing
  }

  params.push(id)

  const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`)
  stmt.run(...params)

  const updated = getTask(id)!
  return updated
}

export function deleteTask(id: string): boolean {
  const db = getDb()

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

// ========================================
// User CRUD Operations
// ========================================

export function findOrCreateUser(email: string, name: string, provider: 'github' | 'google' | 'unknown', providerId: string): User {
  const db = getDb()

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  const existing = stmt.get(email) as any

  if (existing) {
    return existing as User
  }

  const id = generateId()
  const now = Date.now()

  const insertStmt = db.prepare(`
    INSERT INTO users (id, email, name, provider, provider_id, approved, created_at, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertStmt.run(id, email, name, provider, providerId, false, now, 'user')

  const user = getUserById(id)!
  return user
}

export function getUserById(id: string): User | undefined {
  const db = getDb()

  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  const row = stmt.get(id) as any

  if (!row) return undefined

  return row as User
}

export function listUsers(filters?: { approved?: boolean }): User[] {
  const db = getDb()

  let query = 'SELECT * FROM users WHERE 1=1'
  const params: any[] = []

  if (filters?.approved !== undefined) {
    query += ' AND approved = ?'
    params.push(filters.approved ? 1 : 0)
  }

  query += ' ORDER BY created_at DESC'

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as any[]

  return rows as User[]
}

export function approveUser(id: string): boolean {
  const db = getDb()

  const stmt = db.prepare('UPDATE users SET approved = 1 WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

export function rejectUser(id: string): boolean {
  const db = getDb()

  const stmt = db.prepare('DELETE FROM users WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

// ========================================
// Metrics
// ========================================

export function getMetrics(): TaskMetrics {
  const db = getDb()

  // Total tasks
  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count as number

  // By status
  const byStatusStmt = db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status')
  const byStatusRows = byStatusStmt.all() as { status: TaskStatus; count: number }[]

  const byStatus: Record<TaskStatus, number> = {
    'Not Started': 0,
    'In Progress': 0,
    'Completed': 0,
    'Cancelled': 0,
    'On Hold': 0
  }

  for (const row of byStatusRows) {
    byStatus[row.status] = row.count
  }

  // By category
  const byCategoryStmt = db.prepare('SELECT category, COUNT(*) as count FROM tasks GROUP BY category')
  const byCategoryRows = byCategoryStmt.all() as { category: string; count: number }[]

  const byCategory: Record<string, number> = {}
  for (const row of byCategoryRows) {
    byCategory[row.category] = row.count
  }

  // Completion rate: (completed / total) * 100
  const completionRate = total > 0 ? (byStatus['Completed'] / total) * 100 : 0

  // Failure rate: (cancelled / total) * 100
  const failureRate = total > 0 ? (byStatus['Cancelled'] / total) * 100 : 0

  // Last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const last7DaysStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE created_at >= ?')
  const last7Days = (last7DaysStmt.get(weekAgo) as any).count as number

  // Last 30 days
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const last30DaysStmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE created_at >= ?')
  const last30Days = (last30DaysStmt.get(monthAgo) as any).count as number

  return {
    total,
    byStatus,
    byCategory,
    completionRate: Math.round(completionRate * 10) / 10,
    failureRate: Math.round(failureRate * 10) / 10,
    last7Days,
    last30Days
  }
}
