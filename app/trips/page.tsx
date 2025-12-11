import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Calendar, User, DollarSign } from 'lucide-react'
import { appendFile } from 'fs/promises'
import { join } from 'path'
import TripsFilter from '@/components/trips-filter'
import { Suspense } from 'react'

interface TripsPageProps {
  searchParams?: Promise<{ driver?: string }> | { driver?: string }
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:17',message:'Page component started',data:{hasSearchParams:!!searchParams,searchParamsIsPromise:searchParams instanceof Promise},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:24',message:'User auth check',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'B'})+'\n');}catch(e){}
  // #endregion

  if (!user) {
    redirect('/login')
  }

  // Get filter from search params
  const params = searchParams instanceof Promise ? await searchParams : searchParams || {}
  const driverFilter = params?.driver

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:30',message:'Search params parsed',data:{driverFilter,paramsType:searchParams instanceof Promise ? 'Promise' : typeof params},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion

  // Fetch all drivers for the filter
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('id, name')
    .order('name', { ascending: true })

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:36',message:'Drivers query result',data:{hasError:!!driversError,errorMessage:driversError?.message,driversIsNull:!drivers,driversLength:drivers?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'C'})+'\n');}catch(e){}
  // #endregion

  // Build query for trips
  let tripsQuery = supabase
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

  // Apply driver filter if specified
  if (driverFilter && driverFilter !== 'all') {
    tripsQuery = tripsQuery.eq('driver_id', driverFilter)
  }

  const { data: trips, error } = await tripsQuery

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:56',message:'Trips query result',data:{hasError:!!error,errorMessage:error?.message,tripsIsNull:!trips,tripsLength:trips?.length,driverFilter},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'C'})+'\n');}catch(e){}
  // #endregion

  if (error) {
    console.error('Error fetching trips:', error)
  }

  // Handle error case - ensure trips is an empty array if null/undefined
  const safeTrips = trips || []

  // Calculate stats for filtered trips (filtering happens in the query)
  const filteredTrips = safeTrips
  const totalTrips = filteredTrips.length || 0
  const totalRevenue = filteredTrips.reduce((sum, trip) => sum + Number(trip.total_invoice || 0), 0) || 0
  const totalDriverEarnings = filteredTrips.reduce((sum, trip) => sum + Number(trip.driver_earnings || 0), 0) || 0
  const totalCompanyEarnings = filteredTrips.reduce((sum, trip) => sum + Number(trip.company_earnings || 0), 0) || 0

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/trips/page.tsx:75',message:'Before render',data:{safeTripsLength:safeTrips.length,filteredTripsLength:filteredTrips.length,totalTrips,totalRevenue,driversLength:drivers?.length,willRenderFilter:!!(drivers && drivers.length > 0)},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'D'})+'\n');}catch(e){}
  // #endregion

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Trips</h1>
          <p className="text-muted-foreground mt-1">View and manage all uploaded trips</p>
        </div>
        {drivers && drivers.length > 0 && (
          <Suspense fallback={<div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />}>
            <TripsFilter drivers={drivers} />
          </Suspense>
        )}
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
          {!safeTrips || safeTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No trips uploaded yet</p>
              <p className="text-sm mt-2">Upload your first trip from a driver&apos;s profile page</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No trips found for selected driver</p>
              <p className="text-sm mt-2">Try selecting a different driver or view all trips</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrips.map((trip) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/3c98a534-df79-472e-90e9-e6b096ba1309',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/trips/page.tsx:153',message:'Rendering trip item',data:{tripId:trip?.id,driversExists:!!trip?.drivers,driverType:trip?.drivers?.driver_type,hasTripName:!!trip?.trip_name},timestamp:Date.now(),sessionId:'debug-session',runId:'test-local',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                return (
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
                            {trip.drivers?.driver_type === 'company_driver' ? 'Company Driver' : 'Owner Operator'}
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
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
