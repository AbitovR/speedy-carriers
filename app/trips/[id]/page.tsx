'use client'

import { createClient } from '@/lib/supabase/client'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function TripDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function fetchTrip() {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3c98a534-df79-472e-90e9-e6b096ba1309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/trips/[id]/page.tsx:18',message:'fetchTrip entry',data:{tripId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:drivers(*),
          loads(*),
          expenses(*)
        `)
        .eq('id', id)
        .single()

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3c98a534-df79-472e-90e9-e6b096ba1309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/trips/[id]/page.tsx:30',message:'fetchTrip query result',data:{hasError:!!error,hasData:!!data,errorMessage:error?.message,driverIsNull:!data?.driver,loadsIsNull:!data?.loads,loadsIsArray:Array.isArray(data?.loads)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (error || !data) {
        notFound()
      } else {
        setTrip(data)
      }
      setLoading(false)
    }

    fetchTrip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (!trip) {
    notFound()
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c98a534-df79-472e-90e9-e6b096ba1309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/trips/[id]/page.tsx:57',message:'Before accessing trip.driver.driver_type',data:{tripExists:!!trip,driverExists:!!trip?.driver,driverType:trip?.driver?.driver_type,loadsExists:!!trip?.loads,loadsIsArray:Array.isArray(trip?.loads)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Safety check: if driver is missing, show error
  if (!trip.driver) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">Driver information not found for this trip.</p>
        </div>
      </div>
    )
  }

  const driverType = trip.driver.driver_type
  const percentage = driverType === 'owner_operator' ? 100 : 32

  // Helper function to safely get numeric values
  const getNum = (value: any): number => Number(value) || 0

  // Normalize payment method (cash/cod -> cash, check/ach -> check, else -> billing)
  const normalizePaymentMethod = (method: string) => {
    const normalized = method?.toLowerCase().trim() || ''
    if (normalized === 'cod' || normalized === 'cash') return 'cash'
    if (normalized === 'check' || normalized === 'ach') return 'check'
    return 'billing'
  }

  // Calculate breakdown by payment method
  let cashGross = 0
  let checkGross = 0
  let billingGross = 0

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c98a534-df79-472e-90e9-e6b096ba1309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/trips/[id]/page.tsx:65',message:'Before trip.loads.forEach',data:{loadsExists:!!trip?.loads,loadsIsArray:Array.isArray(trip?.loads),loadsLength:trip?.loads?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  trip.loads?.forEach((load: any) => {
    if (!load) return
    const price = Number(load.price) || 0
    const brokerFee = Number(load.broker_fee) || 0
    const gross = price - brokerFee
    const method = normalizePaymentMethod(load.payment_method || '')

    if (method === 'cash') {
      cashGross += gross
    } else if (method === 'check') {
      checkGross += gross
    } else {
      billingGross += gross
    }
  })

  return (
    <div className="space-y-6">
      <Link
        href={`/drivers/${trip.driver_id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Driver
      </Link>

      {/* Trip Header */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{trip.trip_name}</h1>
            <p className="text-muted-foreground mt-1">
              {trip.driver.name} • {formatDate(trip.trip_date)}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors print:hidden"
          >
            <Download className="h-4 w-4" />
            Print Statement
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Loads</p>
            <p className="text-lg font-bold text-foreground">{trip.total_loads}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Invoice</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(getNum(trip.total_invoice))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Driver Earnings</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(getNum(trip.driver_earnings))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {driverType === 'owner_operator' ? 'Dispatch Fee (10%)' : 'Company Net'}
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(getNum(trip.company_earnings))}
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Payment Breakdown</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Total Invoice Price</span>
            <span className="font-bold">{formatCurrency(Number(trip.total_invoice) || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>- Broker Fee</span>
            <span>-{formatCurrency(Number(trip.total_broker_fees) || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b-2 font-bold">
            <span>Total Gross</span>
            <span>{formatCurrency((Number(trip.total_invoice) || 0) - (Number(trip.total_broker_fees) || 0))}</span>
          </div>

          {driverType === 'owner_operator' && (
            <>
              {/* Step 1: Local Towing Fee (deducted first) */}
              {trip.expenses?.find((e: any) => e?.category === 'local_towing') && (
                <div className="pt-3">
                  <p className="font-semibold text-foreground mb-2">
                    Step 1: Local Towing Fee (Deducted First):
                  </p>
                  {trip.expenses
                    ?.filter((e: any) => e?.category === 'local_towing')
                    .map((expense: any) => (
                      <div key={expense.id} className="flex justify-between py-1">
                        <span>- Local Towing</span>
                        <span>-{formatCurrency(Number(expense.amount) || 0)}</span>
                      </div>
                    ))}
                  <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-900/30 px-3 rounded font-bold">
                    <span>Gross After Towing</span>
                    <span>
                      {formatCurrency(
                        (getNum(trip.total_invoice) - getNum(trip.total_broker_fees)) -
                        (Number(trip.expenses?.find((e: any) => e?.category === 'local_towing')?.amount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: Dispatch Fee (calculated from gross after towing) */}
              <div className="pt-3">
                <p className="font-semibold text-foreground mb-2">
                  Step 2: Dispatch Fee (10% of Gross After Towing):
                </p>
                <div className="flex justify-between py-1">
                  <span>- Dispatch Fee</span>
                  <span>
                    -{formatCurrency(getNum(trip.company_earnings))}
                  </span>
                </div>
              </div>

              {/* Step 3: Other Expenses (excluding local towing) */}
              {trip.expenses?.filter((e: any) => e?.category !== 'local_towing').length > 0 && (
                <div className="pt-3">
                  <p className="font-semibold text-foreground mb-2">
                    Step 3: Other Expenses:
                  </p>
                  {trip.expenses
                    ?.filter((e: any) => e?.category !== 'local_towing')
                    .map((expense: any) => {
                      if (!expense) return null
                      return (
                        <div key={expense.id} className="flex justify-between py-1">
                          <span>- {(expense.category || '').replace('_', ' ')}</span>
                          <span>-{formatCurrency(Number(expense.amount) || 0)}</span>
                        </div>
                      )
                    })}
                </div>
              )}

              <div className="pt-3">
                <p className="font-semibold text-foreground mb-2">
                  Owner Operator Payment:
                </p>
                <div className="flex justify-between py-3 bg-yellow-50 dark:bg-yellow-900/20 px-3 rounded font-bold text-green-600">
                  <span>OWNER OPERATOR EARNINGS</span>
                  <span className="text-lg">{formatCurrency(getNum(trip.driver_earnings))}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 bg-muted px-3 rounded font-bold">
                <span>Dispatch Fee to Company (10%)</span>
                <span>{formatCurrency(getNum(trip.company_earnings))}</span>
              </div>

              <div className="pt-4 border-t-2">
                <p className="font-semibold text-foreground mb-3">Payment Settlement:</p>
                <div className="flex justify-between py-2">
                  <span>Total Owner Earnings</span>
                  <span className="font-bold">{formatCurrency(getNum(trip.driver_earnings))}</span>
                </div>
                <div className="flex justify-between py-2 text-red-600">
                  <span>Less: Cash/COD Collected by Owner</span>
                  <span>-{formatCurrency(cashGross)}</span>
                </div>
                <div className="flex justify-between py-3 bg-green-100 dark:bg-green-900/30 px-3 rounded font-bold text-green-800 dark:text-green-400 border-t-2">
                  <span>NET DUE FROM COMPANY</span>
                  <span className="text-lg">
                    {formatCurrency(Math.max(0, getNum(trip.driver_earnings) - cashGross))}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>✓ Check/ACH Due</span>
                    <span>{formatCurrency(checkGross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📋 Billing Due</span>
                    <span>{formatCurrency(billingGross)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {driverType === 'company_driver' && (
            <>
              {/* Step 1: Local Towing Fee (deducted first) */}
              {trip.expenses?.find((e: any) => e?.category === 'local_towing') && (
                <div className="pt-3">
                  <p className="font-semibold text-foreground mb-2">
                    Step 1: Local Towing Fee (Deducted First):
                  </p>
                  {trip.expenses
                    ?.filter((e: any) => e?.category === 'local_towing')
                    .map((expense: any) => (
                      <div key={expense.id} className="flex justify-between py-1">
                        <span>- Local Towing</span>
                        <span>-{formatCurrency(Number(expense.amount) || 0)}</span>
                      </div>
                    ))}
                  <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-900/30 px-3 rounded font-bold">
                    <span>Gross After Towing</span>
                    <span>
                      {formatCurrency(
                        (getNum(trip.total_invoice) - getNum(trip.total_broker_fees)) -
                        (Number(trip.expenses?.find((e: any) => e?.category === 'local_towing')?.amount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: Driver Payment (32% of Gross After Towing) */}
              <div className="pt-3">
                <p className="font-semibold text-foreground mb-2">
                  Step 2: Driver Payment ({percentage}% of Gross After Towing):
                </p>
                <div className="flex justify-between py-3 bg-yellow-50 dark:bg-yellow-900/20 px-3 rounded font-bold text-green-600">
                  <span>DRIVER EARNINGS</span>
                  <span className="text-lg">{formatCurrency(getNum(trip.driver_earnings))}</span>
                </div>
              </div>

              {/* Step 3: Company Expenses */}
              <div className="pt-3">
                <p className="font-semibold text-muted-foreground mb-2">
                  Step 3: Company Expenses (NOT deducted from driver):
                </p>
                <div className="flex justify-between py-1">
                  <span>- Dispatch Fee (10% of Gross After Towing)</span>
                  <span>
                    -{formatCurrency(
                      ((getNum(trip.total_invoice) - getNum(trip.total_broker_fees)) -
                       (Number(trip.expenses?.find((e: any) => e?.category === 'local_towing')?.amount) || 0)) * 0.1
                    )}
                  </span>
                </div>
                {trip.expenses
                  ?.filter((e: any) => e?.category !== 'local_towing')
                  .map((expense: any) => {
                    if (!expense) return null
                    return (
                      <div key={expense.id} className="flex justify-between py-1">
                        <span>- {(expense.category || '').replace('_', ' ')}</span>
                        <span>-{formatCurrency(Number(expense.amount) || 0)}</span>
                      </div>
                    )
                  })}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Company Expenses</span>
                  <span>-{formatCurrency(getNum(trip.expenses_total))}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 bg-muted px-3 rounded font-bold">
                <span>Net to Company (Gross - Driver Pay - Expenses)</span>
                <span>{formatCurrency(getNum(trip.company_earnings))}</span>
              </div>

              <div className="pt-4 border-t-2">
                <p className="font-semibold text-foreground mb-3">
                  Driver Payment Breakdown by Method:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>💵 Cash Payment Due (incl. COD)</span>
                    <span className="font-bold">{formatCurrency(cashGross * 0.32)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✓ Check/ACH Due</span>
                    <span className="font-bold">{formatCurrency(checkGross * 0.32)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📋 Billing Due</span>
                    <span className="font-bold">{formatCurrency(billingGross * 0.32)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Individual Loads */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Individual Loads ({trip.total_loads})
        </h2>
        <div className="space-y-3">
          {!trip.loads || trip.loads.length === 0 ? (
            <p className="text-muted-foreground">No loads found for this trip.</p>
          ) : (
            trip.loads.map((load: any, idx: number) => {
              if (!load) return null
              const price = Number(load.price) || 0
              const brokerFee = Number(load.broker_fee) || 0
              return (
              <div key={load.id || idx} className="border-b pb-3 last:border-b-0">
                <div className="font-medium text-foreground">
                  {idx + 1}. {load.vehicle || 'Unknown Vehicle'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {load.customer || 'Unknown Customer'} • {(load.payment_method || '').toUpperCase()} • Price:{' '}
                  {formatCurrency(price)} | Broker: -{formatCurrency(brokerFee)} | Gross:{' '}
                  {formatCurrency(price - brokerFee)}
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
