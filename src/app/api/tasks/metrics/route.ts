import { NextResponse } from 'next/server'
import { getMetrics } from '@/lib/db'

export async function GET() {
  try {
    const metrics = getMetrics()
    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}