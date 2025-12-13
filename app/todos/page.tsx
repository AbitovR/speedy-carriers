'use client'

import { useState, useEffect } from 'react'
import { KanbanBoard, type KanbanColumn } from '@/components/ui/trello-kanban-board'
import { CheckSquare } from 'lucide-react'

const STORAGE_KEY = 'speedy-carriers-todos'

const defaultColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [],
  },
]

export default function TodosPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setColumns(parsed)
      } catch (error) {
        console.error('Failed to load todos:', error)
      }
    }
  }, [])

  // Save to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  }, [columns])

  const handleColumnsChange = (newColumns: KanbanColumn[]) => {
    setColumns(newColumns)
  }

  const handleTaskMove = (taskId: string, fromColumnId: string, toColumnId: string) => {
    // This is handled by the KanbanBoard component
    console.log(`Task ${taskId} moved from ${fromColumnId} to ${toColumnId}`)
  }

  const handleTaskAdd = (columnId: string, title: string) => {
    console.log(`Task "${title}" added to ${columnId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">To-Do List</h1>
          <p className="text-muted-foreground mt-1">Manage your daily tasks and track progress</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <KanbanBoard
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onTaskMove={handleTaskMove}
          onTaskAdd={handleTaskAdd}
          columnColors={{
            todo: 'bg-blue-500',
            'in-progress': 'bg-amber-500',
            done: 'bg-emerald-500',
          }}
          allowAddTask={true}
        />
      </div>
    </div>
  )
}

