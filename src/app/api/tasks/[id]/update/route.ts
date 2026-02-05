import { NextRequest, NextResponse } from 'next/server'
import { updateTask } from '@/lib/db'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  try {
    const body = await request.json()

    const task = updateTask(id, {
      status: body.status,
      completed_at: body.completed_at,
      reason: body.reason,
      additional_comments: body.additional_comments,
      project: body.project,
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 },
    )
  }
}
