'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Truck,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  GripVertical,
  Plus,
  X,
  Search,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Load {
  id: string
  load_id: string
  customer: string
  price: number
  payment_method: string
  notes: string | null
  created_at: string
  pickup_location?: string
  dropoff_location?: string
}

interface Trip {
  id: string
  name: string
  date: string
  orders: Load[]
  totalInvoice: number
  totalDriverEarnings: number
  totalCompanyEarnings: number
}

interface DragDropTripCreatorProps {
  driverId: string
  onClose: () => void
}

const LOCATIONS = ['Yard', 'New York', 'Connecticut', 'New Jersey'] as const

const SortableOrderCard = ({ order }: { order: Load }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const notes = order.notes || ''
  const additionalMoneyMatch = notes.match(/Additional Cash: \$([\d.]+)/)
  const additionalMoney = additionalMoneyMatch ? parseFloat(additionalMoneyMatch[1]) : 0
  const pickupMatch = notes.match(/Pickup: ([^|]+)/)
  const dropoffMatch = notes.match(/Dropoff: ([^|]+)/)
  const pickupLocation = pickupMatch ? pickupMatch[1].trim() : 'Unknown'
  const dropoffLocation = dropoffMatch ? dropoffMatch[1].trim() : 'Unknown'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card rounded-lg p-4 border border-border',
        'shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">
              Order {order.load_id}
            </span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{dropoffLocation}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-secondary rounded">
                {order.payment_method}
              </span>
              {additionalMoney > 0 && (
                <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded">
                  +{formatCurrency(additionalMoney)}
                </span>
              )}
            </div>
            <span className="font-semibold text-primary text-lg">
              {formatCurrency(order.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const SortableTripCard = ({
  trip,
  onRemoveOrder,
  onUpdateTrip,
}: {
  trip: Trip
  onRemoveOrder: (orderId: string) => void
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void
}) => {
  const { setNodeRef } = useSortable({ id: trip.id })

  return (
    <div
      ref={setNodeRef}
      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-2 border-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={trip.name}
              onChange={(e) => onUpdateTrip(trip.id, { name: e.target.value })}
              className="font-semibold text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 w-full"
              placeholder="Trip Name"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <input
                type="date"
                value={trip.date}
                onChange={(e) => onUpdateTrip(trip.id, { date: e.target.value })}
                className="bg-transparent border-none outline-none focus:outline-none text-muted-foreground"
              />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total Earnings</div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(trip.totalDriverEarnings)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(trip.totalInvoice)} total
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {trip.orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drag orders here to add to trip</p>
          </div>
        ) : (
          trip.orders.map((order) => {
            const notes = order.notes || ''
            const pickupMatch = notes.match(/Pickup: ([^|]+)/)
            const dropoffMatch = notes.match(/Dropoff: ([^|]+)/)
            const pickupLocation = pickupMatch ? pickupMatch[1].trim() : 'Unknown'
            const dropoffLocation = dropoffMatch ? dropoffMatch[1].trim() : 'Unknown'
            const additionalMoneyMatch = notes.match(/Additional Cash: \$([\d.]+)/)
            const additionalMoney = additionalMoneyMatch ? parseFloat(additionalMoneyMatch[1]) : 0

            return (
              <div
                key={order.id}
                className="bg-card rounded-lg p-3 border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-3 h-3 text-primary" />
                      <span className="font-medium text-sm text-foreground">
                        Order {order.load_id}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="truncate">{pickupLocation} → {dropoffLocation}</div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-secondary rounded">
                          {order.payment_method}
                        </span>
                        {additionalMoney > 0 && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            +{formatCurrency(additionalMoney)}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-sm text-primary">
                        {formatCurrency(order.price)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveOrder(order.id)}
                    className="ml-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function DragDropTripCreator({ driverId, onClose }: DragDropTripCreatorProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Load[]>([])
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: 'trip-new-1',
      name: `Trip ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      orders: [],
      totalInvoice: 0,
      totalDriverEarnings: 0,
      totalCompanyEarnings: 0,
    },
  ])
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchAvailableOrders()
  }, [driverId])

  const fetchAvailableOrders = async () => {
    setLoadingOrders(true)
    try {
      const supabase = createClient()
      const { data: loads, error } = await (supabase as any)
        .from('loads')
        .select('*')
        .is('trip_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(loads || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setMessage({ type: 'error', text: 'Failed to load available orders' })
    } finally {
      setLoadingOrders(false)
    }
  }

  const calculateTripTotals = useCallback((tripOrders: Load[]) => {
    const DISPATCH_FEE = 0.10
    let totalInvoice = 0
    let totalDriverEarnings = 0
    let totalCompanyEarnings = 0

    tripOrders.forEach((order) => {
      const orderPrice = Number(order.price) || 0
      const dispatchFee = orderPrice * DISPATCH_FEE
      const grossAfterDispatch = orderPrice - dispatchFee

      const notes = order.notes || ''
      const additionalMoneyMatch = notes.match(/Additional Cash: \$([\d.]+)/)
      const additionalMoney = (order.payment_method === 'cash' && additionalMoneyMatch)
        ? parseFloat(additionalMoneyMatch[1])
        : 0

      const driverEarnings = order.payment_method === 'cash'
        ? grossAfterDispatch - additionalMoney
        : grossAfterDispatch

      totalInvoice += orderPrice
      totalDriverEarnings += driverEarnings
      totalCompanyEarnings += dispatchFee
    })

    return { totalInvoice, totalDriverEarnings, totalCompanyEarnings }
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.load_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [orders, searchQuery])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveAnOrder = orders.some((order) => order.id === activeId)
    const isOverATrip = trips.some((trip) => trip.id === overId)

    if (isActiveAnOrder && isOverATrip) {
      const order = orders.find((o) => o.id === activeId)
      if (!order) return

      setOrders((prev) => prev.filter((o) => o.id !== activeId))
      setTrips((prev) =>
        prev.map((trip) => {
          if (trip.id === overId) {
            const newOrders = [...trip.orders, order]
            const totals = calculateTripTotals(newOrders)
            return {
              ...trip,
              orders: newOrders,
              ...totals,
            }
          }
          return trip
        })
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
  }

  const handleRemoveOrderFromTrip = (tripId: string, orderId: string) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return

    const order = trip.orders.find((o) => o.id === orderId)
    if (!order) return

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const newOrders = t.orders.filter((o) => o.id !== orderId)
          const totals = calculateTripTotals(newOrders)
          return {
            ...t,
            orders: newOrders,
            ...totals,
          }
        }
        return t
      })
    )

    setOrders((prev) => [...prev, order])
  }

  const handleCreateTrip = () => {
    const newTrip: Trip = {
      id: `trip-new-${Date.now()}`,
      name: `Trip ${trips.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      orders: [],
      totalInvoice: 0,
      totalDriverEarnings: 0,
      totalCompanyEarnings: 0,
    }
    setTrips((prev) => [...prev, newTrip])
  }

  const handleUpdateTrip = (tripId: string, updates: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id === tripId) {
          return { ...trip, ...updates }
        }
        return trip
      })
    )
  }

  const handleSaveTrips = async () => {
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

      // Save each trip that has orders
      for (const trip of trips) {
        if (trip.orders.length === 0) continue

        // Create trip
        const { data: tripData, error: tripError } = await (supabase as any)
          .from('trips')
          .insert([
            {
              driver_id: driverId,
              user_id: user.id,
              trip_name: trip.name,
              trip_date: trip.date,
              file_name: null,
              file_url: null,
              total_loads: trip.orders.length,
              total_invoice: trip.totalInvoice,
              total_broker_fees: 0,
              driver_earnings: trip.totalDriverEarnings,
              company_earnings: trip.totalCompanyEarnings,
              expenses_total: trip.totalCompanyEarnings,
              is_local_driver_order: true,
            },
          ])
          .select()
          .single()

        if (tripError) throw tripError

        // Update loads to link them to the trip
        const loadIds = trip.orders.map((o) => o.id)
        const { error: updateError } = await (supabase as any)
          .from('loads')
          .update({ trip_id: tripData.id })
          .in('id', loadIds)

        if (updateError) throw updateError

        // Create dispatch fee expense
        const { error: expenseError } = await (supabase as any).from('expenses').insert([
          {
            trip_id: tripData.id,
            category: 'dispatch_fee',
            amount: trip.totalCompanyEarnings,
            notes: '10% dispatch fee for local driver trip',
          },
        ])

        if (expenseError) throw expenseError
      }

      setMessage({ type: 'success', text: 'Trips created successfully!' })
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create trips' })
    } finally {
      setLoading(false)
    }
  }

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null

  const totalEarnings = trips.reduce((sum, trip) => sum + trip.totalDriverEarnings, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create Trips</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drag orders to trips to calculate earnings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="text-xs text-muted-foreground">Total Earnings</div>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(totalEarnings)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
                : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Available Orders ({filteredOrders.length})
                </h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              {loadingOrders ? (
                <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-border rounded-md">
                  No available orders. Create orders first without selecting a trip.
                </div>
              ) : (
                <SortableContext
                  items={filteredOrders.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <SortableOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Trips ({trips.length})
                </h3>
                <button
                  onClick={handleCreateTrip}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Trip
                </button>
              </div>

              <SortableContext
                items={trips.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <SortableTripCard
                      key={trip.id}
                      trip={trip}
                      onRemoveOrder={(orderId) => handleRemoveOrderFromTrip(trip.id, orderId)}
                      onUpdateTrip={handleUpdateTrip}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>

          <DragOverlay>
            {activeOrder ? (
              <div className="bg-card rounded-lg p-4 border-2 border-primary shadow-xl opacity-90">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        Order {activeOrder.load_id}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(activeOrder.price)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="border-t border-border p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTrips}
            disabled={loading || trips.every((t) => t.orders.length === 0)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Saving...' : `Save ${trips.filter((t) => t.orders.length > 0).length} Trip(s)`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}


