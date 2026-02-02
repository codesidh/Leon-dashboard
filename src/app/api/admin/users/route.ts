import { NextResponse } from 'next/server'
import { listUsers, approveUser, rejectUser } from '@/lib/db'

export async function GET() {
  try {
    const users = listUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}