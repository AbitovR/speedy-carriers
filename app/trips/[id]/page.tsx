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
  const supabase = createClient()

  useEffect(() => {
    async function fetchTrip() {
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

      if (error || !data) {
        notFound()
      } else {
        setTrip(data)
      }
      setLoading(false)
    }

    fetchTrip()
  }, [id])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!trip) {
    notFound()
  }

  const driverType = trip.driver.driver_type
  const percentage = driverType === 'owner_operator' ? 90 : 32

  // Calculate breakdown by payment method
  let cashGross = 0
  let checkGross = 0
  let billingGross = 0

  trip.loads.forEach((load: any) => {
    const gross = load.price - load.broker_fee
    const method = load.payment_method.toLowerCase()

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
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Driver
      </Link>

      {/* Trip Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{trip.trip_name}</h1>
            <p className="text-gray-600 mt-1">
              {trip.driver.name} • {formatDate(trip.trip_date)}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors print:hidden"
          >
            <Download className="h-4 w-4" />
            Print Statement
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Loads</p>
            <p className="text-lg font-bold text-gray-900">{trip.total_loads}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Invoice</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(trip.total_invoice)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Driver Earnings</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(trip.driver_earnings)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Company Net</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(trip.company_earnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Breakdown</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Total Invoice Price</span>
            <span className="font-bold">{formatCurrency(trip.total_invoice)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>- Broker Fee</span>
            <span>-{formatCurrency(trip.total_broker_fees)}</span>
          </div>
          <div className="flex justify-between py-2 border-b-2 border-gray-300 font-bold">
            <span>Total Gross</span>
            <span>{formatCurrency(trip.total_invoice - trip.total_broker_fees)}</span>
          </div>

          {driverType === 'owner_operator' && (
            <>
              <div className="pt-3">
                <p className="font-semibold text-gray-700 mb-2">
                  Expenses (Deducted from Gross):
                </p>
                <div className="flex justify-between py-1">
                  <span>- Dispatch Fee (10%)</span>
                  <span>
                    -{formatCurrency((trip.total_invoice - trip.total_broker_fees) * 0.1)}
                  </span>
                </div>
                {trip.expenses?.map((expense: any) => (
                  <div key={expense.id} className="flex justify-between py-1">
                    <span>- {expense.category.replace('_', ' ')}</span>
                    <span>-{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Expenses</span>
                  <span>-{formatCurrency(trip.expenses_total)}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 bg-green-50 px-3 rounded font-bold">
                <span>Net Gross (After Expenses)</span>
                <span>
                  {formatCurrency(trip.total_invoice - trip.total_broker_fees - trip.expenses_total)}
                </span>
              </div>

              <div className="pt-3">
                <p className="font-semibold text-gray-700 mb-2">
                  Owner Operator Payment ({percentage}% of Net Gross):
                </p>
                <div className="flex justify-between py-3 bg-yellow-50 px-3 rounded font-bold text-green-600">
                  <span>OWNER OPERATOR EARNINGS</span>
                  <span className="text-lg">{formatCurrency(trip.driver_earnings)}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 bg-gray-50 px-3 rounded font-bold">
                <span>Net to Company</span>
                <span>{formatCurrency(trip.company_earnings)}</span>
              </div>

              <div className="pt-4 border-t-2">
                <p className="font-semibold text-gray-700 mb-3">Payment Settlement:</p>
                <div className="flex justify-between py-2">
                  <span>Total Owner Earnings</span>
                  <span className="font-bold">{formatCurrency(trip.driver_earnings)}</span>
                </div>
                <div className="flex justify-between py-2 text-red-600">
                  <span>Less: Cash/COD Collected by Owner</span>
                  <span>-{formatCurrency(cashGross)}</span>
                </div>
                <div className="flex justify-between py-3 bg-green-50 px-3 rounded font-bold text-green-600 border-t-2">
                  <span>NET DUE FROM COMPANY</span>
                  <span className="text-lg">
                    {formatCurrency(Math.max(0, trip.driver_earnings - cashGross))}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
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
              <div className="pt-3">
                <p className="font-semibold text-gray-700 mb-2">
                  Driver Payment ({percentage}% of Gross):
                </p>
                <div className="flex justify-between py-3 bg-yellow-50 px-3 rounded font-bold text-green-600">
                  <span>DRIVER EARNINGS</span>
                  <span className="text-lg">{formatCurrency(trip.driver_earnings)}</span>
                </div>
              </div>

              <div className="pt-3">
                <p className="font-semibold text-gray-600 mb-2">
                  Company Expenses (NOT deducted from driver):
                </p>
                <div className="flex justify-between py-1">
                  <span>- Dispatch Fee (10%)</span>
                  <span>
                    -{formatCurrency((trip.total_invoice - trip.total_broker_fees) * 0.1)}
                  </span>
                </div>
                {trip.expenses?.map((expense: any) => (
                  <div key={expense.id} className="flex justify-between py-1">
                    <span>- {expense.category.replace('_', ' ')}</span>
                    <span>-{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Company Expenses</span>
                  <span>-{formatCurrency(trip.expenses_total)}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 bg-gray-50 px-3 rounded font-bold">
                <span>Net to Company (Gross - Driver Pay - Expenses)</span>
                <span>{formatCurrency(trip.company_earnings)}</span>
              </div>

              <div className="pt-4 border-t-2">
                <p className="font-semibold text-gray-700 mb-3">
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Individual Loads ({trip.total_loads})
        </h2>
        <div className="space-y-3">
          {trip.loads.map((load: any, idx: number) => (
            <div key={load.id} className="border-b pb-3 last:border-b-0">
              <div className="font-medium text-gray-900">
                {idx + 1}. {load.vehicle}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {load.customer} • {load.payment_method.toUpperCase()} • Price:{' '}
                {formatCurrency(load.price)} | Broker: -{formatCurrency(load.broker_fee)} | Gross:{' '}
                {formatCurrency(load.price - load.broker_fee)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
