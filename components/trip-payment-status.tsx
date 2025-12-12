'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, X, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface TripPaymentStatusProps {
  tripId: string
  currentStatus: 'paid_in_full' | 'payment_on_hold' | null
  currentPaymentMethod: 'bank_transfer' | 'check' | 'zelle' | null
  currentPaymentDate: string | null
  currentHoldReason: string | null
}

export default function TripPaymentStatus({
  tripId,
  currentStatus,
  currentPaymentMethod,
  currentPaymentDate,
  currentHoldReason,
}: TripPaymentStatusProps) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [paymentStatus, setPaymentStatus] = useState<'paid_in_full' | 'payment_on_hold' | null>(currentStatus)
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'check' | 'zelle' | null>(currentPaymentMethod)
  const [paymentDate, setPaymentDate] = useState(currentPaymentDate || '')
  const [holdReason, setHoldReason] = useState(currentHoldReason || '')

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Validate required fields based on status
      if (paymentStatus === 'paid_in_full') {
        if (!paymentMethod) {
          setMessage({ type: 'error', text: 'Please select a payment method' })
          setLoading(false)
          return
        }
        if (!paymentDate) {
          setMessage({ type: 'error', text: 'Please select a payment date' })
          setLoading(false)
          return
        }
      } else if (paymentStatus === 'payment_on_hold') {
        if (!holdReason || holdReason.trim() === '') {
          setMessage({ type: 'error', text: 'Please provide a reason for hold' })
          setLoading(false)
          return
        }
      }

      // Update trip
      const updateData: any = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }

      if (paymentStatus === 'paid_in_full') {
        updateData.payment_method = paymentMethod
        updateData.payment_date = paymentDate
        updateData.hold_reason = null
      } else if (paymentStatus === 'payment_on_hold') {
        updateData.hold_reason = holdReason
        updateData.payment_method = null
        updateData.payment_date = null
      } else {
        // Clearing status
        updateData.payment_method = null
        updateData.payment_date = null
        updateData.hold_reason = null
      }

      const { error } = await (supabase as any)
        .from('trips')
        .update(updateData)
        .eq('id', tripId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Payment status updated successfully!' })
      setTimeout(() => {
        setShowPanel(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update payment status' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!paymentStatus) return null

    if (paymentStatus === 'paid_in_full') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Paid in Full
        </span>
      )
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Payment on Hold
        </span>
      )
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {getStatusBadge()}
        <button
          onClick={() => setShowPanel(true)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          {paymentStatus ? 'Update Status' : 'Set Payment Status'}
        </button>
      </div>

      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={() => setShowPanel(false)}
          />

          {/* Side Slide Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Payment Status</h2>
              <button
                onClick={() => setShowPanel(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-md ${
                    message.type === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Status *
                </label>
                <select
                  value={paymentStatus || ''}
                  onChange={(e) => {
                    const value = e.target.value as 'paid_in_full' | 'payment_on_hold' | ''
                    setPaymentStatus(value === '' ? null : value)
                    // Clear related fields when status changes
                    if (value !== 'paid_in_full') {
                      setPaymentMethod(null)
                      setPaymentDate('')
                    }
                    if (value !== 'payment_on_hold') {
                      setHoldReason('')
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="">Not Set</option>
                  <option value="paid_in_full">Paid in Full</option>
                  <option value="payment_on_hold">Payment on Hold</option>
                </select>
              </div>

              {paymentStatus === 'paid_in_full' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod || ''}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as 'bank_transfer' | 'check' | 'zelle' | null)
                      }
                      required
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    >
                      <option value="">Select payment method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="zelle">Zelle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                </>
              )}

              {paymentStatus === 'payment_on_hold' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hold Reason *
                  </label>
                  <select
                    value={holdReason && !['damage_claim', 'dispute', 'pending_investigation'].includes(holdReason) ? 'other' : holdReason}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setHoldReason('')
                      } else {
                        setHoldReason(e.target.value)
                      }
                    }}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground mb-2"
                  >
                    <option value="">Select reason</option>
                    <option value="damage_claim">Damage Claim</option>
                    <option value="dispute">Dispute</option>
                    <option value="pending_investigation">Pending Investigation</option>
                    <option value="other">Other</option>
                  </select>
                  {(holdReason === 'other' || (holdReason && !['damage_claim', 'dispute', 'pending_investigation'].includes(holdReason))) && (
                    <input
                      type="text"
                      placeholder="Specify reason"
                      value={holdReason && !['damage_claim', 'dispute', 'pending_investigation'].includes(holdReason) ? holdReason : ''}
                      onChange={(e) => setHoldReason(e.target.value)}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground mt-2"
                    />
                  )}
                </div>
              )}

              {/* Display current payment info if paid */}
              {paymentStatus === 'paid_in_full' && paymentMethod && paymentDate && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-foreground">Payment Information</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Method: <span className="font-medium text-foreground capitalize">{paymentMethod.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: <span className="font-medium text-foreground">{formatDate(paymentDate)}</span>
                  </p>
                </div>
              )}

              {/* Display hold reason if on hold */}
              {paymentStatus === 'payment_on_hold' && holdReason && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-foreground">Hold Reason</p>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {holdReason.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="px-6 py-4 border-t border-border flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Status'}
              </button>
              <button
                onClick={() => setShowPanel(false)}
                disabled={loading}
                className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

