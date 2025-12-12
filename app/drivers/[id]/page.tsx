import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Edit, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import TripUploadButton from '@/components/trip-upload-button'
import DeleteTripButton from '@/components/delete-trip-button'
import { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']
type Driver = Database['public']['Tables']['drivers']['Row']

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

  // Type assertion for TypeScript
  const typedDriver = driver as Driver

  // Fetch trips for this driver
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', id)
    .order('trip_date', { ascending: false })

  // Type assertion for TypeScript
  const typedTrips: Trip[] = (trips || []) as Trip[]

  // Calculate stats
  const totalTrips = typedTrips.length
  const totalRevenue = typedTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
  const totalEarnings = typedTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
  const totalLoads = typedTrips.reduce((sum, trip) => sum + (trip.total_loads || 0), 0)

  return (
    <div className="space-y-6">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Drivers
      </Link>

      {/* Driver Header */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{typedDriver.name}</h1>
            <p className="text-muted-foreground mt-1">
              {typedDriver.driver_type === 'company_driver'
                ? 'Company Driver (32%)'
                : 'Owner Operator (100% after 10% dispatch fee)'}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                typedDriver.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-foreground'
              }`}
            >
              {typedDriver.status}
            </span>
            <Link
              href={`/drivers/${id}/edit`}
              className="inline-flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {typedDriver.email && (
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{typedDriver.email}</p>
            </div>
          )}
          {typedDriver.phone && (
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{typedDriver.phone}</p>
            </div>
          )}
          {typedDriver.license_number && (
            <div>
              <p className="text-muted-foreground">License</p>
              <p className="font-medium text-foreground">{typedDriver.license_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-sm text-muted-foreground">Total Trips</p>
          <p className="text-3xl font-bold text-foreground mt-2">{totalTrips}</p>
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-sm text-muted-foreground">Total Loads</p>
          <p className="text-3xl font-bold text-foreground mt-2">{totalLoads}</p>
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-sm text-muted-foreground">Driver Earnings</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
      </div>

      {/* Trips Section */}
      <div className="bg-card rounded-lg shadow">
        <div className="px-6 py-4 border-b border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Trip History</h2>
          <TripUploadButton driverId={id} driverType={typedDriver.driver_type as 'company_driver' | 'owner_operator'} />
        </div>

        <div className="overflow-x-auto">
          {trips && trips.length > 0 ? (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trip Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Loads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Driver Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {typedTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {trip.trip_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(trip.trip_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {trip.total_loads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                      {formatCurrency(trip.total_invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(trip.driver_earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="text-primary hover:text-primary/90 inline-flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </Link>
                        <DeleteTripButton tripId={trip.id} tripName={trip.trip_name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No trips yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload a trip file to get started
              </p>
              <TripUploadButton driverId={id} driverType={typedDriver.driver_type as 'company_driver' | 'owner_operator'} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
