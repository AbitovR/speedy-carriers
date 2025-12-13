'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { calculateTripSummary, normalizePaymentMethod, type Load, type Expenses } from '@/lib/calculations'

interface TripUploadButtonProps {
  driverId: string
  driverType: 'company_driver' | 'owner_operator'
}

export default function TripUploadButton({ driverId, driverType }: TripUploadButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)

  // Form state
  const [tripName, setTripName] = useState('')
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0])
  const [expenses, setExpenses] = useState<Expenses>({
    parking: 0,
    eldLogbook: 0,
    insurance: 0,
    fuel: 0,
    ifta: 0,
    localTowing: 0,
    quickPayFee: 0,
    prepass: 0,
    shipcar: 0,
    superDispatch: 0,
    other: 0,
    paidInAdvance: 0,
    cashCollectedByLocalDriver: 0,
  })
  const [otherExpenseComment, setOtherExpenseComment] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Extract trip name from filename (remove extension)
      const name = selectedFile.name.replace(/\.[^/.]+$/, '')
      setTripName(name)
    }
  }

  const parseFile = async (file: File): Promise<Load[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          const loads: Load[] = []

          jsonData.forEach((row: any) => {
            const loadId = String(row['Load ID'] || '').trim()
            const customer = String(row['Customer'] || '').trim()
            const vehicle = String(row['Vehicles'] || '').trim()
            const price = parseFloat(row['Total Price']) || 0
            const brokerFee = parseFloat(row['Broker Fee']) || 0
            const paymentMethod = normalizePaymentMethod(row['Method'])

            if (loadId && customer && price > 0) {
              loads.push({
                loadId,
                customer,
                vehicle,
                price,
                brokerFee,
                paymentMethod,
              })
            }
          })

          if (loads.length === 0) {
            reject(new Error('No valid loads found in the file'))
          } else {
            resolve(loads)
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Parse the file
      const loads = await parseFile(file)

      // Calculate summary
      const summary = calculateTripSummary(loads, driverType, expenses)

      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${tripName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`
      const filePath = `${user.id}/${driverId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('trip-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trip-files')
        .getPublicUrl(filePath)

      // Insert trip
      const { data: tripData, error: tripError } = await (supabase as any)
        .from('trips')
        .insert([
          {
            driver_id: driverId,
            user_id: user.id,
            trip_name: tripName,
            trip_date: tripDate,
            file_name: file.name,
            file_url: urlData.publicUrl,
            total_loads: loads.length,
            total_invoice: summary.totalPrice,
            total_broker_fees: summary.totalBrokerFee,
            driver_earnings: summary.driverPay,
            company_earnings:
              driverType === 'owner_operator'
                ? summary.dispatchFeeAmount  // Owner operators: company gets only the 10% dispatch fee
                : summary.totalGrossAfterQuickPay - summary.driverPay - summary.dispatchFeeAmount - summary.otherExpenses, // Company drivers: gross after towing and quick pay fee minus driver pay, dispatch fee, and other expenses
            expenses_total: summary.totalExpenses,
          },
        ])
        .select()
        .single()

      if (tripError) throw tripError

      // Insert loads
      const loadsToInsert = loads.map((load) => ({
        trip_id: tripData.id,
        load_id: load.loadId,
        customer: load.customer,
        vehicle: load.vehicle,
        price: load.price,
        broker_fee: load.brokerFee,
        payment_method: load.paymentMethod,
        notes: load.notes || null,
      }))

      const { error: loadsError } = await (supabase as any).from('loads').insert(loadsToInsert)

      if (loadsError) throw loadsError

      // Insert expenses if any
      const expensesToInsert = []
      if (expenses.parking > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'parking', amount: expenses.parking })
      if (expenses.eldLogbook > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'eld_logbook', amount: expenses.eldLogbook })
      if (expenses.insurance > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'insurance', amount: expenses.insurance })
      if (expenses.fuel > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'fuel', amount: expenses.fuel })
      if (expenses.ifta > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'ifta', amount: expenses.ifta })
      if (expenses.localTowing > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'local_towing', amount: expenses.localTowing })
      if (expenses.quickPayFee > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'quick_pay_fee', amount: expenses.quickPayFee })
      if (expenses.prepass > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'prepass', amount: expenses.prepass })
      if (expenses.shipcar > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'shipcar', amount: expenses.shipcar })
      if (expenses.superDispatch > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'super_dispatch', amount: expenses.superDispatch })
      if (expenses.other > 0) expensesToInsert.push({ 
        trip_id: tripData.id, 
        category: 'other', 
        amount: expenses.other,
        notes: otherExpenseComment.trim() || null
      })
      if (expenses.paidInAdvance > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'paid_in_advance', amount: expenses.paidInAdvance })
      if (expenses.cashCollectedByLocalDriver > 0) expensesToInsert.push({ trip_id: tripData.id, category: 'cash_collected_by_local_driver', amount: expenses.cashCollectedByLocalDriver })

      if (expensesToInsert.length > 0) {
        await (supabase as any).from('expenses').insert(expensesToInsert)
      }

      setMessage({ type: 'success', text: 'Trip uploaded successfully!' })
      // Reset form
      setFile(null)
      setTripName('')
      setTripDate(new Date().toISOString().split('T')[0])
      setExpenses({
        parking: 0,
        eldLogbook: 0,
        insurance: 0,
        fuel: 0,
        ifta: 0,
        localTowing: 0,
        quickPayFee: 0,
        prepass: 0,
        shipcar: 0,
        superDispatch: 0,
        other: 0,
        paidInAdvance: 0,
        cashCollectedByLocalDriver: 0,
      })
      setOtherExpenseComment('')
      setTimeout(() => {
        setShowModal(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload trip' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload className="h-5 w-5" />
        Upload Trip
      </button>

      {showModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          />
          
          {/* Side Slide Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Upload Trip</h2>
              <button
                onClick={() => setShowModal(false)}
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
                  Trip File (CSV or Excel) *
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  SuperDispatch trip report format
                </p>
              </div>

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
                        Quick Pay Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.quickPayFee}
                        onChange={(e) =>
                          setExpenses({ ...expenses, quickPayFee: parseFloat(e.target.value) || 0 })
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
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cash Collected by Local Driver
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses.cashCollectedByLocalDriver}
                        onChange={(e) =>
                          setExpenses({ ...expenses, cashCollectedByLocalDriver: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        This amount is excluded from owner&apos;s net earnings but included in total revenue
                      </p>
                    </div>
                    <div className="col-span-2">
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
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground mb-2"
                      />
                      <textarea
                        value={otherExpenseComment}
                        onChange={(e) => setOtherExpenseComment(e.target.value)}
                        placeholder="Add comments for this expense..."
                        rows={2}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
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
                onClick={handleUpload}
                disabled={loading || !file}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Uploading...' : 'Upload Trip'}
              </button>
              <button
                onClick={() => setShowModal(false)}
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
