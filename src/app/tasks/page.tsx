'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  category: string
  summary: string
  description?: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold'
  created_at: number
  completed_at?: number
  reason?: string
  additional_comments?: string
}

interface TaskMetrics {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  completionRate: number
  failureRate: number
  last7Days: number
  last30Days: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchMetrics()
  }, [])

  async function fetchTasks() {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  async function fetchMetrics() {
    const res = await fetch('/api/tasks/metrics')
    const data = await res.json()
    setMetrics(data.metrics || null)
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterCategory !== 'all' && task.category !== filterCategory) return false
    return true
  })

  const categories = Array.from(new Set(tasks.map(t => t.category)))

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleString()
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'Not Started': return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200'
      case 'On Hold': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track and monitor all tasks issued to Leon
        </p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{metrics.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{metrics.failureRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Failure Rate</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{metrics.last7Days}</div>
            <div className="text-sm text-muted-foreground">Last 7 Days</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded border p-2"
        >
          <option value="all">All Status</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="On Hold">On Hold</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded border p-2"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          onClick={() => { setIsCreating(true); setSelectedTask(null) }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      {/* Task List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-accent"
            onClick={() => setSelectedTask(task)}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-medium">{task.summary}</h3>
              <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">
              <div>ID: {task.id}</div>
              <div>Category: {task.category}</div>
              <div>Created: {formatDate(task.created_at)}</div>
              {task.completed_at && <div>Completed: {formatDate(task.completed_at)}</div>}
            </div>
            {task.reason && (
              <div className="mb-2 text-sm text-red-600">Reason: {task.reason}</div>
            )}
            {task.additional_comments && (
              <div className="text-sm text-muted-foreground">Notes: {task.additional_comments}</div>
            )}
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">No tasks found</div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-card border p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Task Details</h2>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">ID:</span> {selectedTask.id}</div>
              <div><span className="font-medium">Category:</span> {selectedTask.category}</div>
              <div><span className="font-medium">Summary:</span> {selectedTask.summary}</div>
              {selectedTask.description && (
                <div><span className="font-medium">Description:</span> {selectedTask.description}</div>
              )}
              <div><span className="font-medium">Status:</span> {selectedTask.status}</div>
              <div><span className="font-medium">Created:</span> {formatDate(selectedTask.created_at)}</div>
              {selectedTask.completed_at && (
                <div><span className="font-medium">Completed:</span> {formatDate(selectedTask.completed_at)}</div>
              )}
              {selectedTask.reason && (
                <div><span className="font-medium">Reason:</span> {selectedTask.reason}</div>
              )}
              {selectedTask.additional_comments && (
                <div><span className="font-medium">Comments:</span> {selectedTask.additional_comments}</div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded border px-4 py-2 hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-card border p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Create Task</h2>
            <CreateTaskForm
              onSuccess={() => {
                setIsCreating(false)
                fetchTasks()
                fetchMetrics()
              }}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CreateTaskForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    category: '',
    summary: '',
    description: '',
    status: 'Not Started' as const,
    additional_comments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert('Failed to create task')
      }
    } catch (error) {
      alert('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium">Category</label>
        <input
          type="text"
          required
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded border p-2"
          placeholder="e.g., DevOps, Healthcare, Personal"
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Summary</label>
        <input
          type="text"
          required
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          className="w-full rounded border p-2"
          placeholder="Brief task description"
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Description (optional)</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded border p-2"
          rows={3}
          placeholder="Detailed description..."
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as any })}
          className="w-full rounded border p-2"
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Comments (optional)</label>
        <textarea
          value={form.additional_comments}
          onChange={(e) => setForm({ ...form, additional_comments: e.target.value })}
          className="w-full rounded border p-2"
          rows={2}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 hover:bg-accent"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  )
}