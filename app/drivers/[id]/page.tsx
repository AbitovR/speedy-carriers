import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Edit, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import TripUploadButton from '@/components/trip-upload-button'

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Verify auth
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch driver
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single()

  if (driverError || !driver) {
    notFound()
  }

  // Fetch trips for this driver
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', id)
    .order('trip_date', { ascending: false })

  // Calculate stats
  const totalTrips = trips?.length || 0
  const totalRevenue = trips?.reduce((sum, trip) => sum + trip.total_invoice, 0) || 0
  const totalEarnings = trips?.reduce((sum, trip) => sum + trip.driver_earnings, 0) || 0
  const totalLoads = trips?.reduce((sum, trip) => sum + trip.total_loads, 0) || 0

  return (
    <div className="space-y-6">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Drivers
      </Link>

      {/* Driver Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{driver.name}</h1>
            <p className="text-gray-600 mt-1">
              {driver.driver_type === 'company_driver'
                ? 'Company Driver (32%)'
                : 'Owner Operator (90%)'}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                driver.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {driver.status}
            </span>
            <Link
              href={`/drivers/${id}/edit`}
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {driver.email && (
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{driver.email}</p>
            </div>
          )}
          {driver.phone && (
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{driver.phone}</p>
            </div>
          )}
          {driver.license_number && (
            <div>
              <p className="text-gray-600">License</p>
              <p className="font-medium text-gray-900">{driver.license_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Trips</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalTrips}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Loads</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalLoads}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Driver Earnings</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
      </div>

      {/* Trips Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Trip History</h2>
          <TripUploadButton driverId={id} driverType={driver.driver_type} />
        </div>

        <div className="overflow-x-auto">
          {trips && trips.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trip.trip_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(trip.trip_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trip.total_loads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(trip.total_invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(trip.driver_earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No trips yet
              </h3>
              <p className="text-gray-600 mb-6">
                Upload a trip file to get started
              </p>
              <TripUploadButton driverId={id} driverType={driver.driver_type} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
