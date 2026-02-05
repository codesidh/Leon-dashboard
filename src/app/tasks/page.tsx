'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  project?: string | null
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

const STATUS_ORDER: Task['status'][] = [
  'In Progress',
  'Not Started',
  'On Hold',
  'Completed',
  'Cancelled',
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
  }, [])

  const fetchMetrics = useCallback(async (projectFilter: string) => {
    const url =
      projectFilter && projectFilter !== 'all'
        ? `/api/tasks/metrics?project=${encodeURIComponent(projectFilter)}`
        : '/api/tasks/metrics'

    const res = await fetch(url)
    const data = await res.json()
    setMetrics(data.metrics || null)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMetrics(filterProject)
  }, [fetchMetrics, filterProject])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false
      if (filterCategory !== 'all' && task.category !== filterCategory) return false
      if (filterProject !== 'all' && (task.project || '') !== filterProject) return false
      return true
    })
  }, [tasks, filterStatus, filterCategory, filterProject])

  const categories = Array.from(new Set(tasks.map((t) => t.category)))
  const projects = Array.from(
    new Set(tasks.map((t) => t.project).filter(Boolean)),
  ) as string[]

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleString()
  }

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
              getStatusBadgeClasses(status),
            )}
          >
            {status}
          </span>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.status
        const b = rowB.original.status
        return STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)
      },
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="max-w-xs truncate">
            <div className="text-sm font-medium text-foreground">
              {task.summary}
            </div>
            {task.description && (
              <div className="text-xs text-muted-foreground">
                {task.description}
              </div>
            )}
            {task.additional_comments && (
              <div className="text-xs text-muted-foreground">
                {task.additional_comments}
              </div>
            )}
            {task.reason && (
              <div className="text-xs text-destructive">
                Reason: {task.reason}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'project',
      header: 'Project',
      cell: ({ row }) => {
        const project = row.original.project
        return (
          <span className="text-xs text-muted-foreground">
            {project ?? '—'}
          </span>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'completed_at',
      header: 'Completed',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.completed_at
            ? formatDate(row.original.completed_at)
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'id',
      header: () => <div className="text-right">ID</div>,
      cell: ({ row }) => (
        <div className="max-w-[180px] text-right text-[11px] text-muted-foreground">
          <span className="font-mono">{row.original.id}</span>
        </div>
      ),
    },
  ]

  function getStatusBadgeClasses(status: Task['status']): string {
    switch (status) {
      case 'Not Started':
        return 'bg-muted text-muted-foreground border-dashed'
      case 'In Progress':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      case 'Cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and monitor all work issued to Leon across projects.
        </p>
      </div>

      {/* Metrics row */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total tasks
              </CardTitle>
              <CardDescription>
                {filterProject === 'all'
                  ? 'All projects, all time'
                  : `Project: ${filterProject}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {metrics.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Completion rate
              </CardTitle>
              <CardDescription>Completed vs. all tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight text-emerald-500">
                  {metrics.completionRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Failure {metrics.failureRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Last 7 days</CardTitle>
              <CardDescription>Tasks created recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {metrics.last7Days}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Last 30 days</CardTitle>
              <CardDescription>Rolling monthly volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {metrics.last30Days}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            <CardDescription>
              Narrow tasks by status, category, or project. Metrics reflect the
              selected project.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilterStatus('all')
                setFilterCategory('all')
                setFilterProject('all')
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              + New task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Project
            </label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium">Task list</CardTitle>
            <CardDescription>
              {filteredTasks.length} matching task
              {filteredTasks.length === 1 ? '' : 's'}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No tasks found. Adjust filters or create a new task.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredTasks}
              initialPageSize={25}
              initialSorting={[
                { id: 'status', desc: false },
                { id: 'created_at', desc: true },
              ]}
              getRowId={(task) => task.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal – keep simple for now */}
      {isCreating && (
        <CreateTaskDialog
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false)
            fetchTasks()
            fetchMetrics(filterProject)
          }}
        />
      )}
    </div>
  )
}

function CreateTaskDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    project: '',
    category: '',
    summary: '',
    description: '',
    status: 'Not Started' as Task['status'],
    additional_comments: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        onCreated()
      } else {
        // Basic inline feedback; can be swapped for toast later
        alert('Failed to create task')
      }
    } catch {
      alert('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Create task</CardTitle>
          <CardDescription>
            Capture a new unit of work for Leon to track.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Project (optional)
                </label>
                <input
                  type="text"
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. echolyne"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Engineering, DevOps"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Summary
              </label>
              <input
                type="text"
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Short task description"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Description (optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[80px] w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detailed context or steps..."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Task['status'] })
                  }
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Comments (optional)
                </label>
                <textarea
                  value={form.additional_comments}
                  onChange={(e) =>
                    setForm({ ...form, additional_comments: e.target.value })
                  }
                  className="min-h-[80px] w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
