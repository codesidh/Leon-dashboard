import { NextRequest, NextResponse } from 'next/server'
import { createTask } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.category || !body.summary) {
      return NextResponse.json(
        { error: 'category and summary are required' },
        { status: 400 }
      )
    }

    const task = createTask({
      id: body.id,
      project: body.project,
      category: body.category,
      summary: body.summary,
      description: body.description,
      status: body.status,
      additional_comments: body.additional_comments
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}