'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateTripSummary, type Expenses } from '@/lib/calculations'

interface EditTripButtonProps {
  tripId: string
  tripName: string
  tripDate: string
  driverType: 'company_driver' | 'owner_operator'
  currentExpenses: Array<{ id: string; category: string; amount: number }>
}

export default function EditTripButton({
  tripId,
  tripName: initialTripName,
  tripDate: initialTripDate,
  driverType,
  currentExpenses,
}: EditTripButtonProps) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const [tripName, setTripName] = useState(initialTripName)
  const [tripDate, setTripDate] = useState(initialTripDate)
  const [expenses, setExpenses] = useState<Expenses>({
    parking: 0,
    eldLogbook: 0,
    insurance: 0,
    fuel: 0,
    ifta: 0,
    localTowing: 0,
    prepass: 0,
    shipcar: 0,
    superDispatch: 0,
    other: 0,
    paidInAdvance: 0,
  })

  // Load current expenses into form
  useEffect(() => {
    if (showPanel && currentExpenses) {
      const expenseMap: Partial<Expenses> = {}
      currentExpenses.forEach((exp) => {
        const category = exp.category
        if (category === 'parking') expenseMap.parking = exp.amount
        else if (category === 'eld_logbook') expenseMap.eldLogbook = exp.amount
        else if (category === 'insurance') expenseMap.insurance = exp.amount
        else if (category === 'fuel') expenseMap.fuel = exp.amount
        else if (category === 'ifta') expenseMap.ifta = exp.amount
        else if (category === 'local_towing') expenseMap.localTowing = exp.amount
        else if (category === 'prepass') expenseMap.prepass = exp.amount
        else if (category === 'shipcar') expenseMap.shipcar = exp.amount
        else if (category === 'super_dispatch') expenseMap.superDispatch = exp.amount
        else if (category === 'other') expenseMap.other = exp.amount
        else if (category === 'paid_in_advance') expenseMap.paidInAdvance = exp.amount
      })
      setExpenses((prev) => ({ ...prev, ...expenseMap }))
    }
  }, [showPanel, currentExpenses])

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Get current trip data to recalculate
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*, loads(*)')
        .eq('id', tripId)
        .single()

      if (tripError || !tripData) {
        throw new Error('Failed to fetch trip data')
      }

      // Convert loads to the format expected by calculateTripSummary
      const loads = (tripData.loads || []).map((load: any) => ({
        loadId: load.load_id || '',
        customer: load.customer || '',
        vehicle: load.vehicle || '',
        price: Number(load.price) || 0,
        brokerFee: Number(load.broker_fee) || 0,
        paymentMethod: load.payment_method || 'billing',
      }))

      // Recalculate summary with updated expenses
      const summary = calculateTripSummary(loads, driverType, expenses)

      // Update trip
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          trip_name: tripName,
          trip_date: tripDate,
          driver_earnings: summary.driverPay,
          company_earnings:
            driverType === 'owner_operator'
              ? summary.dispatchFeeAmount
              : summary.totalGrossAfterTowing - summary.driverPay - summary.dispatchFeeAmount - summary.otherExpenses,
          expenses_total: summary.totalExpenses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)

      if (updateError) throw updateError

      // Delete existing expenses
      await supabase.from('expenses').delete().eq('trip_id', tripId)

      // Insert updated expenses
      const expensesToInsert = []
      if (expenses.parking > 0) expensesToInsert.push({ trip_id: tripId, category: 'parking', amount: expenses.parking })
      if (expenses.eldLogbook > 0) expensesToInsert.push({ trip_id: tripId, category: 'eld_logbook', amount: expenses.eldLogbook })
      if (expenses.insurance > 0) expensesToInsert.push({ trip_id: tripId, category: 'insurance', amount: expenses.insurance })
      if (expenses.fuel > 0) expensesToInsert.push({ trip_id: tripId, category: 'fuel', amount: expenses.fuel })
      if (expenses.ifta > 0) expensesToInsert.push({ trip_id: tripId, category: 'ifta', amount: expenses.ifta })
      if (expenses.localTowing > 0) expensesToInsert.push({ trip_id: tripId, category: 'local_towing', amount: expenses.localTowing })
      if (expenses.prepass > 0) expensesToInsert.push({ trip_id: tripId, category: 'prepass', amount: expenses.prepass })
      if (expenses.shipcar > 0) expensesToInsert.push({ trip_id: tripId, category: 'shipcar', amount: expenses.shipcar })
      if (expenses.superDispatch > 0) expensesToInsert.push({ trip_id: tripId, category: 'super_dispatch', amount: expenses.superDispatch })
      if (expenses.other > 0) expensesToInsert.push({ trip_id: tripId, category: 'other', amount: expenses.other })
      if (expenses.paidInAdvance > 0) expensesToInsert.push({ trip_id: tripId, category: 'paid_in_advance', amount: expenses.paidInAdvance })

      if (expensesToInsert.length > 0) {
        const { error: expensesError } = await supabase.from('expenses').insert(expensesToInsert)
        if (expensesError) throw expensesError
      }

      setMessage({ type: 'success', text: 'Trip updated successfully!' })
      setTimeout(() => {
        setShowPanel(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update trip' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors print:hidden"
      >
        <Edit className="h-4 w-4" />
        Edit Trip
      </button>

      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Side Slide Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Edit Trip</h2>
              <button
                onClick={() => setShowPanel(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
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
                  Trip Name *
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="Trip 001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trip Date *
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              {driverType === 'owner_operator' && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Expenses (Owner Operator)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Parking
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.parking}
                        onChange={(e) =>
                          setExpenses({ ...expenses, parking: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ELD/LogBook
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.eldLogbook}
                        onChange={(e) =>
                          setExpenses({ ...expenses, eldLogbook: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Insurance
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.insurance}
                        onChange={(e) =>
                          setExpenses({ ...expenses, insurance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Fuel
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.fuel}
                        onChange={(e) =>
                          setExpenses({ ...expenses, fuel: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        IFTA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.ifta}
                        onChange={(e) =>
                          setExpenses({ ...expenses, ifta: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Local Towing
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.localTowing}
                        onChange={(e) =>
                          setExpenses({ ...expenses, localTowing: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        PrePass
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.prepass}
                        onChange={(e) =>
                          setExpenses({ ...expenses, prepass: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ShipCar
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.shipcar}
                        onChange={(e) =>
                          setExpenses({ ...expenses, shipcar: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Super Dispatch
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.superDispatch}
                        onChange={(e) =>
                          setExpenses({ ...expenses, superDispatch: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Other
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.other}
                        onChange={(e) =>
                          setExpenses({ ...expenses, other: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Paid in Advance
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.paidInAdvance}
                        onChange={(e) =>
                          setExpenses({ ...expenses, paidInAdvance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Note: Dispatch fee (10%) is automatically calculated
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
                {loading ? 'Saving...' : 'Save Changes'}
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

