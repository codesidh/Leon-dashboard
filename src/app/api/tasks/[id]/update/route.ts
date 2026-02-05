import { NextRequest, NextResponse } from 'next/server'
import { updateTask } from '@/lib/db'

export async function POST(request: NextRequest, context: any) {
  const { params } = context
  try {
    const body = await request.json()
    const id = params.id

    const updated = updateTask(id, {
      status: body.status,
      completed_at: body.completed_at,
      reason: body.reason,
      additional_comments: body.additional_comments,
      project: body.project
    })

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task: updated })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
