'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

interface CreateTripFromLoadsButtonProps {
  driverId: string
}

interface Load {
  id: string
  load_id: string
  customer: string
  price: number
  payment_method: string
  notes: string | null
  created_at: string
}

export default function CreateTripFromLoadsButton({ driverId }: CreateTripFromLoadsButtonProps) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingLoads, setLoadingLoads] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [availableLoads, setAvailableLoads] = useState<Load[]>([])
  const [selectedLoadIds, setSelectedLoadIds] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    tripName: '',
    tripDate: new Date().toISOString().split('T')[0],
  })

  // Fetch available loads (without trips) when panel opens
  useEffect(() => {
    if (showPanel) {
      fetchAvailableLoads()
    }
  }, [showPanel, driverId])

  const fetchAvailableLoads = async () => {
    setLoadingLoads(true)
    try {
      const supabase = createClient()
      
      // Get all trips for this driver to find loads
      const { data: trips } = await (supabase as any)
        .from('trips')
        .select('id')
        .eq('driver_id', driverId)
        .eq('is_local_driver_order', true)

      const tripIds = trips?.map((t: any) => t.id) || []
      
      // Get loads that don't have a trip_id or have null trip_id
      const { data: loads, error } = await (supabase as any)
        .from('loads')
        .select('*')
        .or(`trip_id.is.null,trip_id.not.in.(${tripIds.length > 0 ? tripIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter to only loads that match local driver pattern
      const localLoads = (loads || []).filter((load: any) => 
        load.customer?.includes('Local Order') || load.vehicle === 'Local Driver'
      )
      
      setAvailableLoads(localLoads || [])
    } catch (error) {
      console.error('Error fetching loads:', error)
      setMessage({ type: 'error', text: 'Failed to load available orders' })
    } finally {
      setLoadingLoads(false)
    }
  }

  const toggleLoadSelection = (loadId: string) => {
    const newSelection = new Set(selectedLoadIds)
    if (newSelection.has(loadId)) {
      newSelection.delete(loadId)
    } else {
      newSelection.add(loadId)
    }
    setSelectedLoadIds(newSelection)
  }

  const calculateTripTotals = (loads: Load[]) => {
    const DISPATCH_FEE = 0.10
    let totalInvoice = 0
    let totalDriverEarnings = 0
    let totalCompanyEarnings = 0

    loads.forEach((load) => {
      const loadPrice = Number(load.price) || 0
      const dispatchFee = loadPrice * DISPATCH_FEE
      const grossAfterDispatch = loadPrice - dispatchFee
      
      // Parse additional money from notes if cash payment
      const notes = load.notes || ''
      const additionalMoneyMatch = notes.match(/Additional Cash: \$([\d.]+)/)
      const additionalMoney = (load.payment_method === 'cash' && additionalMoneyMatch)
        ? parseFloat(additionalMoneyMatch[1])
        : 0
      
      const driverEarnings = load.payment_method === 'cash'
        ? grossAfterDispatch - additionalMoney
        : grossAfterDispatch

      totalInvoice += loadPrice
      totalDriverEarnings += driverEarnings
      totalCompanyEarnings += dispatchFee
    })

    return {
      totalInvoice,
      totalDriverEarnings,
      totalCompanyEarnings,
      totalLoads: loads.length,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedLoadIds.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one order to add to the trip' })
      return
    }

    if (!formData.tripName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a trip name' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setLoading(false)
        return
      }

      // Get selected loads
      const selectedLoads = availableLoads.filter(load => selectedLoadIds.has(load.id))
      const totals = calculateTripTotals(selectedLoads)

      // Create trip
      const { data: tripData, error: tripError } = await (supabase as any)
        .from('trips')
        .insert([
          {
            driver_id: driverId,
            user_id: user.id,
            trip_name: formData.tripName,
            trip_date: formData.tripDate,
            file_name: null,
            file_url: null,
            total_loads: totals.totalLoads,
            total_invoice: totals.totalInvoice,
            total_broker_fees: 0,
            driver_earnings: totals.totalDriverEarnings,
            company_earnings: totals.totalCompanyEarnings,
            expenses_total: totals.totalCompanyEarnings,
            is_local_driver_order: true,
          },
        ])
        .select()
        .single()

      if (tripError) throw tripError

      // Update loads to link them to the trip
      const { error: updateError } = await (supabase as any)
        .from('loads')
        .update({ trip_id: tripData.id })
        .in('id', Array.from(selectedLoadIds))

      if (updateError) throw updateError

      // Create dispatch fee expense
      const { error: expenseError } = await (supabase as any).from('expenses').insert([
        {
          trip_id: tripData.id,
          category: 'dispatch_fee',
          amount: totals.totalCompanyEarnings,
          notes: '10% dispatch fee for local driver trip',
        },
      ])

      if (expenseError) throw expenseError

      setMessage({ type: 'success', text: `Trip created successfully with ${selectedLoadIds.size} order(s)!` })
      
      setTimeout(() => {
        setShowPanel(false)
        router.push(`/trips/${tripData.id}`)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create trip' })
    } finally {
      setLoading(false)
    }
  }

  const selectedLoads = availableLoads.filter(load => selectedLoadIds.has(load.id))
  const totals = selectedLoads.length > 0 ? calculateTripTotals(selectedLoads) : null

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="inline-flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Trip from Orders
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-3xl bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-foreground">Create Trip from Orders</h2>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tripName" className="block text-sm font-medium text-foreground mb-2">
                        Trip Name *
                      </label>
                      <input
                        id="tripName"
                        type="text"
                        required
                        value={formData.tripName}
                        onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        placeholder="Week 1 Deliveries"
                      />
                    </div>

                    <div>
                      <label htmlFor="tripDate" className="block text-sm font-medium text-foreground mb-2">
                        Trip Date *
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select Orders to Add ({selectedLoadIds.size} selected)
                    </label>
                    {loadingLoads ? (
                      <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                    ) : availableLoads.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-border rounded-md">
                        No available orders. Create orders first without selecting a trip.
                      </div>
                    ) : (
                      <div className="border border-border rounded-md max-h-96 overflow-y-auto">
                        {availableLoads.map((load) => {
                          const isSelected = selectedLoadIds.has(load.id)
                          const notes = load.notes || ''
                          const additionalMoneyMatch = notes.match(/Additional Cash: \$([\d.]+)/)
                          const additionalMoney = additionalMoneyMatch ? parseFloat(additionalMoneyMatch[1]) : 0
                          
                          return (
                            <div
                              key={load.id}
                              onClick={() => toggleLoadSelection(load.id)}
                              className={`p-4 border-b border-border cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-primary border-primary' : 'border-border'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-foreground">Order {load.load_id}</span>
                                    <span className="font-bold text-foreground">{formatCurrency(load.price)}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{load.customer}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                    <span>Payment: {load.payment_method}</span>
                                    {additionalMoney > 0 && (
                                      <span className="text-green-600 dark:text-green-400">
                                        +{formatCurrency(additionalMoney)} additional
                                      </span>
                                    )}
                                    <span>{new Date(load.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {totals && (
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <h3 className="font-semibold text-foreground">Trip Summary</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Orders:</span>
                        <span className="font-medium text-foreground">{totals.totalLoads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Invoice:</span>
                        <span className="font-medium text-foreground">{formatCurrency(totals.totalInvoice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dispatch Fee (10%):</span>
                        <span className="font-medium text-foreground">{formatCurrency(totals.totalCompanyEarnings)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span className="font-semibold text-foreground">Total Driver Earnings:</span>
                        <span className="font-bold text-foreground">{formatCurrency(totals.totalDriverEarnings)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading || selectedLoadIds.size === 0}
                      className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Creating Trip...' : `Create Trip with ${selectedLoadIds.size} Order(s)`}
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

