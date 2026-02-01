type ToolInvokeBody = {
  tool: string
  action?: string
  args?: Record<string, any>
  sessionKey?: string
}

export type ToolInvokeResult<T = any> =
  | { ok: true; result: T }
  | { ok: false; error: { type?: string; message?: string } | string }

function getGatewayConfig() {
  const baseUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789"
  const token = process.env.OPENCLAW_GATEWAY_TOKEN
  return { baseUrl, token }
}

function tryParseTextJson(x: any): any {
  try {
    if (typeof x !== "string") return null
    const t = x.trim()
    if (!t) return null
    if (!(t.startsWith("{") || t.startsWith("["))) return null
    return JSON.parse(t)
  } catch {
    return null
  }
}

export async function openclawInvokeTool<T = any>(body: ToolInvokeBody): Promise<ToolInvokeResult<T>> {
  const { baseUrl, token } = getGatewayConfig()

  if (!token) {
    return { ok: false, error: { message: "Missing OPENCLAW_GATEWAY_TOKEN" } }
  }

  const res = await fetch(`${baseUrl}/tools/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const data = (await res.json().catch(() => null)) as any

  if (!res.ok) {
    return { ok: false, error: data?.error?.message || data?.error || `HTTP ${res.status}` }
  }

  if (!data || data.ok !== true) {
    return { ok: false, error: data?.error || "Unknown error" }
  }

  // Many tools return their data as a single text block inside result.content[].text.
  // If that text is JSON, parse it and return the parsed object for easier UI use.
  const maybeText = data?.result?.content?.[0]?.text
  const parsed = tryParseTextJson(maybeText)
  if (parsed !== null) {
    return { ok: true, result: parsed as T }
  }

  return { ok: true, result: data.result as T }
}
