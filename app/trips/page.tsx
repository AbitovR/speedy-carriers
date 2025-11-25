import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Calendar, User, DollarSign } from 'lucide-react'

export default async function TripsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all trips with driver information
  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      *,
      drivers (
        id,
        name,
        driver_type
      )
    `)
    .order('trip_date', { ascending: false })

  if (error) {
    console.error('Error fetching trips:', error)
  }

  const totalTrips = trips?.length || 0
  const totalRevenue = trips?.reduce((sum, trip) => sum + Number(trip.total_invoice), 0) || 0
  const totalDriverEarnings = trips?.reduce((sum, trip) => sum + Number(trip.driver_earnings), 0) || 0
  const totalCompanyEarnings = trips?.reduce((sum, trip) => sum + Number(trip.company_earnings), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Trips</h1>
        <p className="text-muted-foreground mt-1">View and manage all uploaded trips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver Earnings</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDriverEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCompanyEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      <Card>
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          {!trips || trips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No trips uploaded yet</p>
              <p className="text-sm mt-2">Upload your first trip from a driver&apos;s profile page</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trip.trip_name}</h3>
                        <Badge variant="secondary">{trip.total_loads} loads</Badge>
                        {trip.drivers && (
                          <Badge variant="outline">
                            {trip.drivers.driver_type === 'company_driver' ? 'Company Driver' : 'Owner Operator'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {trip.drivers?.name || 'Unknown Driver'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(trip.trip_date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-xl font-bold">{formatCurrency(Number(trip.total_invoice))}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Driver: {formatCurrency(Number(trip.driver_earnings))} •
                        Company: {formatCurrency(Number(trip.company_earnings))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
