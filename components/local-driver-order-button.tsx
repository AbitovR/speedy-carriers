'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface LocalDriverOrderButtonProps {
  driverId: string
}

const LOCATIONS = ['Yard', 'New York', 'Connecticut', 'New Jersey'] as const

export default function LocalDriverOrderButton({ driverId }: LocalDriverOrderButtonProps) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    orderNumber: '',
    pickupLocation: '' as typeof LOCATIONS[number] | '',
    dropoffLocation: '' as typeof LOCATIONS[number] | '',
    payment: '',
    paymentMethod: 'billing' as 'cash' | 'check' | 'billing',
    additionalMoney: '', // Additional money when cash is selected
    tripDate: new Date().toISOString().split('T')[0],
    weeklyStatement: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!formData.pickupLocation || !formData.dropoffLocation) {
      setMessage({ type: 'error', text: 'Please select both pickup and dropoff locations' })
      setLoading(false)
      return
    }

    if (!formData.orderNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter an order number' })
      setLoading(false)
      return
    }

    const paymentAmount = parseFloat(formData.payment)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid payment amount' })
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setLoading(false)
        return
      }

      // Calculate trip summary for local driver
      // Local drivers: 10% dispatch fee applies, they get 100% after dispatch fee
      // If payment method is cash, deduct cash amount (payment + additional money) from driver earnings
      const DISPATCH_FEE = 0.10
      const totalInvoice = paymentAmount
      const dispatchFeeAmount = totalInvoice * DISPATCH_FEE
      const grossAfterDispatchFee = totalInvoice - dispatchFeeAmount
      
      // If cash payment, calculate total cash collected (payment + additional money)
      const additionalMoneyAmount = formData.paymentMethod === 'cash' && formData.additionalMoney 
        ? parseFloat(formData.additionalMoney) || 0 
        : 0
      const totalCashCollected = formData.paymentMethod === 'cash' 
        ? paymentAmount + additionalMoneyAmount 
        : 0
      
      // Driver earnings calculation:
      // - If cash payment: Gross After Dispatch Fee - Additional Money (additional money is advance payment)
      // - If other payment methods: Gross After Dispatch Fee
      const driverEarnings = formData.paymentMethod === 'cash'
        ? grossAfterDispatchFee - additionalMoneyAmount
        : grossAfterDispatchFee
      const companyEarnings = dispatchFeeAmount

      // Create trip for local driver order
      const { data: tripData, error: tripError } = await (supabase as any)
        .from('trips')
        .insert([
          {
            driver_id: driverId,
            user_id: user.id,
            trip_name: `Order ${formData.orderNumber}`,
            trip_date: formData.tripDate,
            file_name: null, // Local drivers don't upload files
            file_url: null,
            total_loads: 1, // Each order is one load
            total_invoice: totalInvoice,
            total_broker_fees: 0, // No broker fees for local drivers
            driver_earnings: driverEarnings,
            company_earnings: companyEarnings,
            expenses_total: dispatchFeeAmount,
            pickup_location: formData.pickupLocation,
            dropoff_location: formData.dropoffLocation,
            order_number: formData.orderNumber,
            is_local_driver_order: true,
          },
        ])
        .select()
        .single()

      if (tripError) throw tripError

      // Create a load for this order
      let loadNotes = `Pickup: ${formData.pickupLocation}, Dropoff: ${formData.dropoffLocation}`
      if (formData.paymentMethod === 'cash' && additionalMoneyAmount > 0) {
        loadNotes += ` | Additional Cash: $${additionalMoneyAmount.toFixed(2)} | Total Cash Collected: $${totalCashCollected.toFixed(2)}`
      }
      if (formData.weeklyStatement) {
        loadNotes += ' | Include in weekly statement'
      }
      
      const { error: loadError } = await (supabase as any).from('loads').insert([
        {
          trip_id: tripData.id,
          load_id: formData.orderNumber,
          customer: `Local Order - ${formData.pickupLocation} to ${formData.dropoffLocation}`,
          vehicle: 'Local Driver',
          price: totalInvoice,
          broker_fee: 0,
          payment_method: formData.paymentMethod,
          notes: loadNotes,
        },
      ])

      if (loadError) throw loadError

      // Insert dispatch fee as an expense
      const { error: expenseError } = await (supabase as any).from('expenses').insert([
        {
          trip_id: tripData.id,
          category: 'dispatch_fee',
          amount: dispatchFeeAmount,
          notes: '10% dispatch fee for local driver order',
        },
      ])

      if (expenseError) throw expenseError

      setMessage({ type: 'success', text: 'Order created successfully!' })
      
      // Reset form
      setFormData({
        orderNumber: '',
        pickupLocation: '' as typeof LOCATIONS[number] | '',
        dropoffLocation: '' as typeof LOCATIONS[number] | '',
        payment: '',
        paymentMethod: 'billing' as 'cash' | 'check' | 'billing',
        additionalMoney: '',
        tripDate: new Date().toISOString().split('T')[0],
        weeklyStatement: false,
      })

      setTimeout(() => {
        setShowPanel(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create order' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Order
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-foreground">Create Local Driver Order</h2>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {message && (
                  <div
                    className={`p-4 rounded-md ${
                      message.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
                        : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-foreground mb-2">
                      Order Number *
                    </label>
                    <input
                      id="orderNumber"
                      type="text"
                      required
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      placeholder="ORD-001"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pickupLocation" className="block text-sm font-medium text-foreground mb-2">
                        Pickup Location *
                      </label>
                      <select
                        id="pickupLocation"
                        required
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value as typeof LOCATIONS[number] })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      >
                        <option value="">Select pickup location</option>
                        {LOCATIONS.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="dropoffLocation" className="block text-sm font-medium text-foreground mb-2">
                        Dropoff Location *
                      </label>
                      <select
                        id="dropoffLocation"
                        required
                        value={formData.dropoffLocation}
                        onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value as typeof LOCATIONS[number] })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      >
                        <option value="">Select dropoff location</option>
                        {LOCATIONS.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="payment" className="block text-sm font-medium text-foreground mb-2">
                      Payment Amount *
                    </label>
                    <input
                      id="payment"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.payment}
                      onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      placeholder="0.00"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      10% dispatch fee will be deducted automatically
                    </p>
                  </div>

                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-foreground mb-2">
                      Payment Method *
                    </label>
                    <select
                      id="paymentMethod"
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'cash' | 'check' | 'billing', additionalMoney: e.target.value !== 'cash' ? '' : formData.additionalMoney })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    >
                      <option value="billing">Billing</option>
                      <option value="check">Check/ACH</option>
                      <option value="cash">Cash</option>
                    </select>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formData.paymentMethod === 'cash' 
                        ? 'Cash payments will be deducted from driver earnings (cash goes directly to driver)'
                        : 'Company will collect and pay to driver'}
                    </p>
                  </div>

                  {formData.paymentMethod === 'cash' && (
                    <div>
                      <label htmlFor="additionalMoney" className="block text-sm font-medium text-foreground mb-2">
                        Additional Money (Cash)
                      </label>
                      <input
                        id="additionalMoney"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.additionalMoney}
                        onChange={(e) => setFormData({ ...formData, additionalMoney: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        placeholder="0.00"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Additional cash amount collected. Total cash = Payment Amount + Additional Money
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="tripDate" className="block text-sm font-medium text-foreground mb-2">
                      Order Date *
                    </label>
                    <input
                      id="tripDate"
                      type="date"
                      required
                      value={formData.tripDate}
                      onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="weeklyStatement"
                      type="checkbox"
                      checked={formData.weeklyStatement}
                      onChange={(e) => setFormData({ ...formData, weeklyStatement: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="weeklyStatement" className="text-sm font-medium text-foreground">
                      Include in weekly statement
                    </label>
                  </div>

                  {formData.payment && !isNaN(parseFloat(formData.payment)) && parseFloat(formData.payment) > 0 && (() => {
                    const paymentAmount = parseFloat(formData.payment)
                    const dispatchFee = paymentAmount * 0.1
                    const grossAfterDispatch = paymentAmount - dispatchFee
                    const additionalMoneyAmount = formData.paymentMethod === 'cash' && formData.additionalMoney 
                      ? (parseFloat(formData.additionalMoney) || 0) 
                      : 0
                    const totalCashCollected = formData.paymentMethod === 'cash' 
                      ? paymentAmount + additionalMoneyAmount 
                      : 0
                    // Driver earnings = Gross After Dispatch Fee - Additional Money (when cash payment)
                    const driverEarnings = formData.paymentMethod === 'cash'
                      ? grossAfterDispatch - additionalMoneyAmount
                      : grossAfterDispatch
                    
                    return (
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <h3 className="font-semibold text-foreground">Payment Breakdown</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Payment:</span>
                          <span className="font-medium text-foreground">${paymentAmount.toFixed(2)}</span>
                        </div>
                        {formData.paymentMethod === 'cash' && additionalMoneyAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Additional Money (Cash):</span>
                            <span className="font-medium text-foreground">+${additionalMoneyAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {formData.paymentMethod === 'cash' && (
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-foreground">Total Cash Collected:</span>
                            <span className="text-foreground">${totalCashCollected.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dispatch Fee (10%):</span>
                          <span className="font-medium text-foreground">-${dispatchFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gross After Dispatch Fee:</span>
                          <span className="font-medium text-foreground">${grossAfterDispatch.toFixed(2)}</span>
                        </div>
                        {formData.paymentMethod === 'cash' && additionalMoneyAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Additional Money (deducted):</span>
                            <span className="font-medium text-foreground">-${additionalMoneyAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-border">
                          <span className="font-semibold text-foreground">Driver Earnings:</span>
                          <span className={`font-bold ${driverEarnings < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                            ${driverEarnings.toFixed(2)}
                          </span>
                        </div>
                        {formData.paymentMethod === 'cash' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {driverEarnings < 0 ? (
                              <>
                                💵 Driver received ${additionalMoneyAmount.toFixed(2)} in advance but only earned ${grossAfterDispatch.toFixed(2)}. 
                                Driver owes company ${Math.abs(driverEarnings).toFixed(2)}.
                              </>
                            ) : (
                              <>
                                💵 Payment amount (${paymentAmount.toFixed(2)}) goes directly to driver. 
                                {additionalMoneyAmount > 0 && ` Additional money ($${additionalMoneyAmount.toFixed(2)}) was deducted.`}
                                {driverEarnings > 0 && ` Company owes ${driverEarnings.toFixed(2)}.`}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Creating Order...' : 'Create Order'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="flex-1 bg-secondary text-foreground py-2 px-4 rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

