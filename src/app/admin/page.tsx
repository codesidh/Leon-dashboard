'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
  provider: 'github' | 'google'
  provider_id: string
  approved: boolean
  created_at: number
  role: 'admin' | 'user'
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function approveUser(id: string) {
    if (!confirm('Approve this user?')) return

    const res = await fetch(`/api/admin/users/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      await fetchUsers()
    }
  }

  async function rejectUser(id: string) {
    if (!confirm('Reject and remove this user?')) return

    const res = await fetch(`/api/admin/users/${id}/reject`, { method: 'POST' })
    if (res.ok) {
      await fetchUsers()
    }
  }

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Admin — User Approval</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Approve or reject new users who want to access the dashboard.
      </p>

      <div className="mt-8 rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.name || '-'}</td>
                <td className="px-4 py-3 capitalize">{user.provider}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  {user.approved ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  {!user.approved && (
                    <>
                      <button
                        onClick={() => approveUser(user.id)}
                        className="mr-2 rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(user.id)}
                        className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
