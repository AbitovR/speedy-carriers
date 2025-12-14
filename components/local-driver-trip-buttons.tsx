'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import LocalDriverOrderButton from './local-driver-order-button'
import DragDropTripCreator from './drag-drop-trip-creator'

interface LocalDriverTripButtonsProps {
  driverId: string
}

export default function LocalDriverTripButtons({ driverId }: LocalDriverTripButtonsProps) {
  const [showDragDrop, setShowDragDrop] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <LocalDriverOrderButton driverId={driverId} />
        <button
          onClick={() => setShowDragDrop(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Trip
        </button>
      </div>
      {showDragDrop && (
        <DragDropTripCreator
          driverId={driverId}
          onClose={() => setShowDragDrop(false)}
        />
      )}
    </>
  )
}

