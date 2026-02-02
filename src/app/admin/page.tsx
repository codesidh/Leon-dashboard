'use client'

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [users, setUsers] = useState<string[]>(['sridhar@example.com'])
  const [newEmail, setNewEmail] = useState('')
  const [message, setMessage] = useState('')

  function addApprovedUser() {
    if (!newEmail) return
    if (!newEmail.includes('@')) {
      setMessage('Invalid email address')
      return
    }
    setUsers([...users, newEmail])
    setNewEmail('')
    setMessage(`Added ${newEmail} to approved users list`)
  }

  function removeApprovedUser(email: string) {
    setUsers(users.filter(u => u !== email))
    setMessage(`Removed ${email} from approved users list`)
  }

  function generateConfigSnippet() {
    const configLines = [
      '# /etc/oauth2-proxy.conf',
      '# Update approved_users line with this list:',
      `approved_users = ${users.join(',')}`
    ]
    return configLines.join('\n')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Leon Dashboard - Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage approved users for OAuth2 authentication.
          You will need to update <code className="font-mono">/etc/oauth2-proxy.conf</code> with the approved users list.
        </p>
      </div>

      <div className="mb-8 rounded-lg border p-6 bg-card">
        <h2 className="mb-4 text-xl font-semibold">Add Approved User</h2>
        <div className="mb-4 flex gap-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded border p-2"
          />
          <button
            onClick={addApprovedUser}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add User
          </button>
        </div>
        {message && (
          <div className="mb-4 p-3 rounded bg-blue-50 text-blue-800">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6 bg-card">
        <h2 className="mb-4 text-xl font-semibold">Approved Users ({users.length})</h2>
        <div className="space-y-2">
          {users.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No approved users yet. Add users above.
            </div>
          ) : (
            users.map((email) => (
              <div key={email} className="flex items-center justify-between rounded border p-3">
                <span className="font-mono text-sm">{email}</span>
                <button
                  onClick={() => removeApprovedUser(email)}
                  className="rounded border px-3 py-1 text-sm hover:bg-accent"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-card">
        <h2 className="mb-4 text-xl font-semibold">Config Snippet</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Update <code className="font-mono">/etc/oauth2-proxy.conf</code> with this line:
        </p>
        <pre className="mb-3 rounded bg-muted p-3 text-xs overflow-x-auto">
          <code>{generateConfigSnippet()}</code>
        </pre>
        <div className="text-xs text-muted-foreground">
          <strong className="text-red-600">Note:</strong> After updating the config file, restart the OAuth2 proxy service:
          <br />
          <code className="font-mono">sudo systemctl restart oauth2-proxy.service</code>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-muted">
        <h2 className="mb-4 text-xl font-semibold">OAuth App Setup (Not Done)</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">GitHub OAuth App</h3>
            <ol className="ml-6 list-decimal space-y-2 text-sm">
              <li>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">https://github.com/settings/developers</a></li>
              <li>Click "New OAuth App"</li>
              <li>Application name: <code className="font-mono">Leon Dashboard</code></li>
              <li>Homepage URL: <code className="font-mono">https://18.221.219.255</code></li>
              <li>Authorization callback URL: <code className="font-mono">https://18.221.219.255/oauth2/callback</code></li>
              <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold">Google OAuth App</h3>
            <ol className="ml-6 list-decimal space-y-2 text-sm">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">https://console.cloud.google.com/apis/credentials</a></li>
              <li>Create credentials → OAuth client ID</li>
              <li>Application type: <code className="font-mono">Web application</code></li>
              <li>Name: <code className="font-mono">Leon Dashboard</code></li>
              <li>Authorized redirect URIs: <code className="font-mono">https://18.221.219.255/oauth2/callback</code></li>
              <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            </ol>
          </div>
          <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800">
            <strong>Next steps:</strong>
            <ol className="ml-6 list-decimal space-y-1">
              <li>Update <code className="font-mono">/etc/oauth2-proxy.conf</code> with GitHub/Google credentials</li>
              <li>Update <code className="font-mono">approved_users</code> line with desired user emails</li>
              <li>Restart OAuth2 proxy: <code className="font-mono">sudo systemctl restart oauth2-proxy.service</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
