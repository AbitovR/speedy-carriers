'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import { useTransition } from 'react'

interface Driver {
  id: string
  name: string
}

interface TripsFilterProps {
  drivers: Driver[]
}

export default function TripsFilter({ drivers }: TripsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const selectedDriverId = searchParams.get('driver') || 'all'

  const handleFilterChange = (driverId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (driverId === 'all') {
        params.delete('driver')
      } else {
        params.set('driver', driverId)
      }
      router.push(`/trips?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <label htmlFor="driver-filter" className="text-sm font-medium text-foreground">
          Filter by Driver:
        </label>
      </div>
      <select
        id="driver-filter"
        value={selectedDriverId}
        onChange={(e) => handleFilterChange(e.target.value)}
        disabled={isPending}
        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="all">All Drivers</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name}
          </option>
        ))}
      </select>
    </div>
  )
}

