'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteTripButtonProps {
  tripId: string
  tripName: string
}

export default function DeleteTripButton({ tripId, tripName }: DeleteTripButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Delete trip (cascading deletes will handle loads and expenses)
      const { error } = await supabase.from('trips').delete().eq('id', tripId)

      if (error) {
        console.error('Error deleting trip:', error)
        alert('Failed to delete trip. Please try again.')
      } else {
        // Refresh the page to show updated data
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while deleting the trip.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Trip</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{tripName}</strong>? This will also delete
              all associated loads and expenses. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
