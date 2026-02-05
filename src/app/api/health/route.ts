import { NextResponse } from 'next/server'
import { getMetrics } from '@/lib/db'

// Minimal health/diagnostics endpoint so we can quickly validate that
// the API layer and SQLite backing store are functioning.
export async function GET() {
  try {
    // Touch the DB via a lightweight metrics call.
    // Any connection/SQL issues should surface here.
    const metrics = getMetrics()

    return NextResponse.json({
      ok: true,
      metrics,
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Health check failed',
      },
      { status: 500 }
    )
  }
}
