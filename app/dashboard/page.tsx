import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  User,
  Plus,
  Upload,
  BarChart3,
  Navigation2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard data
  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'active')

  const { data: allTrips } = await supabase
    .from('trips')
    .select('*, driver:drivers(name)')
    .order('trip_date', { ascending: false })

  const { data: recentTrips } = await supabase
    .from('trips')
    .select('*, driver:drivers(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate stats
  const totalDrivers = drivers?.length || 0
  const totalTrips = allTrips?.length || 0
  const totalRevenue = allTrips?.reduce((sum, trip) => sum + trip.total_invoice, 0) || 0
  const totalEarnings = allTrips?.reduce((sum, trip) => sum + trip.company_earnings, 0) || 0

  // Calculate this month's data
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthTrips = allTrips?.filter(trip => new Date(trip.trip_date) >= firstDayOfMonth) || []
  const thisMonthRevenue = thisMonthTrips.reduce((sum, trip) => sum + trip.total_invoice, 0)

  // Calculate top drivers
  const driverStats = drivers?.map(driver => {
    const driverTrips = allTrips?.filter(t => t.driver_id === driver.id) || []
    const revenue = driverTrips.reduce((sum, trip) => sum + trip.driver_earnings, 0)
    const trips = driverTrips.length
    return { ...driver, revenue, trips }
  }).sort((a, b) => b.revenue - a.revenue) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet and track trips in real-time</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/drivers/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Driver
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrivers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">All time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Net to company
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Top Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Trips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation2 className="w-5 h-5" />
                  Recent Trips
                </CardTitle>
                <CardDescription>Latest uploaded trips</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTrips && recentTrips.length > 0 ? (
                  recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {trip.total_loads} loads
                          </Badge>
                          <span className="text-sm font-medium">{trip.trip_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.driver?.name || 'Unknown Driver'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(trip.trip_date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(trip.total_invoice)}</div>
                        <Link
                          href={`/trips/${trip.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No trips yet</p>
                    <p className="text-xs">Upload your first trip to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* This Month Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  This Month
                </CardTitle>
                <CardDescription>Performance summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Trips</span>
                    <span className="text-2xl font-bold">{thisMonthTrips.length}</span>
                  </div>
                  <Progress value={thisMonthTrips.length > 0 ? Math.min((thisMonthTrips.length / 10) * 100, 100) : 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</span>
                  </div>
                  <Progress value={thisMonthRevenue > 0 ? Math.min((thisMonthRevenue / 50000) * 100, 100) : 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg per Trip</span>
                    <span className="text-2xl font-bold">
                      {thisMonthTrips.length > 0
                        ? formatCurrency(thisMonthRevenue / thisMonthTrips.length)
                        : '$0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Performers
              </CardTitle>
              <CardDescription>Highest revenue all time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverStats.length > 0 ? (
                driverStats.slice(0, 5).map((driver, index) => (
                  <div key={driver.id} className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {driver.trips} trips • {driver.driver_type === 'company_driver' ? 'Company Driver' : 'Owner Operator'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(driver.revenue)}</div>
                      <Progress value={Math.min((driver.revenue / 20000) * 100, 100)} className="w-20 h-1 mt-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No drivers yet</p>
                  <p className="text-xs">Add your first driver to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/drivers/new">
          <Card className="hover:bg-accent transition-colors cursor-pointer border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">Add New Driver</h3>
              <p className="text-sm text-muted-foreground mt-1">Create a new driver profile</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/drivers">
          <Card className="hover:bg-accent transition-colors cursor-pointer border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">Upload Trip</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a new trip file for a driver</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
