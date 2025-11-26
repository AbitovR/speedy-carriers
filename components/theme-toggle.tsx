'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-5 w-5" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          Light Mode
        </>
      )}
    </button>
  )
}
