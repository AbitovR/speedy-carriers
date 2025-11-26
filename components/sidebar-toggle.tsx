'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './sidebar-provider'

export function SidebarToggle() {
  const { toggle } = useSidebar()

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md hover:bg-muted transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
