import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { openclawInvokeTool } from "@/lib/openclaw"

type Issue = {
  id: number
  number: number
  title: string
  html_url: string
  updated_at: string
  state: "open" | "closed"
  labels: Array<{ name: string }>
}

type SessionSummary = {
  sessionKey: string
  label?: string
  kind?: string
  lastMessageAt?: string
  lastMessage?: { role?: string; content?: string } | null
}

const STATUS_LABELS = [
  { key: "not-started", label: "Not started", gh: "status:not-started" },
  { key: "in-progress", label: "In progress", gh: "status:in-progress" },
  { key: "completed", label: "Completed", gh: "status:completed" },
  { key: "archived", label: "Archived", gh: "status:archived" },
] as const

function groupByStatus(issues: Issue[]) {
  const buckets: Record<string, Issue[]> = Object.fromEntries(
    STATUS_LABELS.map((s) => [s.gh, [] as Issue[]])
  )
  for (const it of issues) {
    const labelNames = new Set(it.labels.map((l) => l.name))
    const status = STATUS_LABELS.map((s) => s.gh).find((l) => labelNames.has(l))
    if (status) buckets[status].push(it)
  }
  return buckets
}

async function fetchIssues(): Promise<Issue[]> {
  const base = process.env.GITHUB_API_BASE_URL || "https://api.github.com"
  const owner = process.env.GITHUB_OWNER || "codesidh"
  const repo = process.env.GITHUB_REPO || "leon-ai-assistant"
  const token = process.env.GITHUB_TOKEN

  if (!token) return []

  const res = await fetch(`${base}/repos/${owner}/${repo}/issues?per_page=100&state=all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  })

  if (!res.ok) return []

  const data = (await res.json()) as Issue[]
  return (data as any[]).filter((x) => !x.pull_request) as Issue[]
}

function IssueCard({ issue }: { issue: Issue }) {
  const status = issue.labels.map((l) => l.name).find((n) => n.startsWith("status:"))
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm font-medium leading-snug">
          <a className="hover:underline" href={issue.html_url} target="_blank" rel="noreferrer">
            #{issue.number} {issue.title}
          </a>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {status ? <Badge variant="secondary">{status}</Badge> : null}
          {issue.state === "closed" ? <Badge>closed</Badge> : <Badge variant="outline">open</Badge>}
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        Updated: {new Date(issue.updated_at).toLocaleString()}
      </CardContent>
    </Card>
  )
}

function SessionCard({ s }: { s: SessionSummary }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm font-medium leading-snug">
          {s.label || s.sessionKey}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {s.kind ? <Badge variant="secondary">{s.kind}</Badge> : null}
          <Badge variant="outline">{s.sessionKey}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-1">
        {s.lastMessageAt ? <div>Last: {new Date(s.lastMessageAt).toLocaleString()}</div> : null}
        {s.lastMessage?.content ? (
          <div className="line-clamp-3">{String(s.lastMessage.content).slice(0, 240)}</div>
        ) : (
          <div>No recent message</div>
        )}
      </CardContent>
    </Card>
  )
}

async function fetchLiveSessions(): Promise<{ ok: boolean; sessions: SessionSummary[]; error?: string }> {
  const out = await openclawInvokeTool<any>({
    tool: "sessions_list",
    args: { limit: 12, activeMinutes: 60 * 24, messageLimit: 1 },
  })

  if (!out.ok) {
    return { ok: false, sessions: [], error: typeof out.error === "string" ? out.error : out.error?.message }
  }

  // The tool result shape is gateway-specific; normalize defensively.
  const sessionsRaw = Array.isArray((out.result as any)?.sessions) ? (out.result as any).sessions : []

  const sessions: SessionSummary[] = sessionsRaw.map((x: any) => ({
    sessionKey: String(x.sessionKey ?? x.key ?? ""),
    label: x.label || x.displayName,
    kind: x.kind,
    lastMessageAt: typeof x.updatedAt === "number" ? new Date(x.updatedAt).toISOString() : x.lastMessageAt,
    lastMessage: (Array.isArray(x.messages) && x.messages.length ? x.messages[x.messages.length - 1] : null) as any,
  }))

  return { ok: true, sessions }
}

export default async function Page() {
  const [issues, live] = await Promise.all([fetchIssues(), fetchLiveSessions()])
  const grouped = groupByStatus(issues)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leon Ops</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Task dashboard (GitHub) + live activity (OpenClaw).
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>Repo: codesidh/leon-ai-assistant</div>
          <div>{issues.length ? `Loaded ${issues.length} issues` : "No issues loaded"}</div>
        </div>
      </div>

      <Separator className="my-8" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Live (OpenClaw)</h2>
          <Badge variant="outline">{live.ok ? live.sessions.length : "error"}</Badge>
        </div>

        {!process.env.OPENCLAW_GATEWAY_TOKEN ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">OpenClaw not configured</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Set <code className="font-mono">OPENCLAW_GATEWAY_TOKEN</code> in the dashboard service.
            </CardContent>
          </Card>
        ) : !live.ok ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">OpenClaw error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{live.error || "Unknown error"}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {live.sessions.map((s) => (
              <SessionCard key={s.sessionKey} s={s} />
            ))}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {!process.env.GITHUB_TOKEN ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">GitHub configuration required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Set <code className="font-mono">GITHUB_TOKEN</code> for this dashboard to read private
              issues.
            </p>
            <p>The token should be repo-scoped and provided via environment variables.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_LABELS.map((s) => (
            <section key={s.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{s.label}</h2>
                <Badge variant="outline">{grouped[s.gh]?.length ?? 0}</Badge>
              </div>
              <div className="space-y-3">
                {(grouped[s.gh] || [])
                  .slice()
                  .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
                  .map((it) => (
                    <IssueCard key={it.id} issue={it} />
                  ))}
                {(grouped[s.gh] || []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">No items</div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Tip: GitHub task labels: <code>status:not-started</code>, <code>status:in-progress</code>,{" "}
        <code>status:completed</code>, <code>status:archived</code>.
      </p>
    </main>
  )
}
