import { NextRequest, NextResponse } from 'next/server'
import { listTasks } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as any
  const category = searchParams.get('category')
  const project = searchParams.get('project')

  const filters: any = {}
  if (status) filters.status = status
  if (category) filters.category = category
  if (project) filters.project = project

  const tasks = listTasks(filters)

  return NextResponse.json({ tasks })
}