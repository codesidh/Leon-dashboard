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

  // Gateway returns either {ok:true, result:<value>} or error envelope
  if (data && data.ok === true) {
    return { ok: true, result: data.result as T }
  }

  return { ok: false, error: data?.error || "Unknown error" }
}
