import { createClient } from '@/lib/supabase/server'
import EnhancedDashboard from '@/components/enhanced-dashboard'
import { writeFile, appendFile } from 'fs/promises'
import { join } from 'path'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard data
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'active')

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/dashboard/page.tsx:12',message:'Dashboard drivers query result',data:{hasError:!!driversError,errorMessage:driversError?.message,driversIsNull:!drivers,driversLength:drivers?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
  // #endregion

  if (driversError) {
    console.error('Error fetching drivers:', driversError)
  }

  const { data: allTrips, error: tripsError } = await supabase
    .from('trips')
    .select('*')
    .order('trip_date', { ascending: false })

  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/dashboard/page.tsx:20',message:'Dashboard trips query result',data:{hasError:!!tripsError,errorMessage:tripsError?.message,tripsIsNull:!allTrips,tripsLength:allTrips?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
  // #endregion

  if (tripsError) {
    console.error('Error fetching trips:', tripsError)
  }

  // Calculate stats
  const totalDrivers = drivers?.length || 0
  const totalTrips = allTrips?.length || 0
  const totalRevenue = allTrips?.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0) || 0
  const totalEarnings = allTrips?.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0) || 0
  const driverEarnings = allTrips?.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0) || 0

  // Calculate monthly data for charts
  const monthlyData = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    const monthTrips = allTrips?.filter(trip => {
      const tripDate = new Date(trip.trip_date)
      return tripDate >= monthStart && tripDate <= monthEnd
    }) || []

    const revenue = monthTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
    const expenses = monthTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
    const earnings = monthTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)

    monthlyData.push({
      name: months[monthDate.getMonth()],
      revenue,
      expenses,
      earnings,
    })
  }

  // Calculate revenue breakdown by driver type
  // #region agent log
  try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/dashboard/page.tsx:60',message:'Before filtering trips by driver type',data:{driversIsNull:!drivers,driversLength:drivers?.length,allTripsIsNull:!allTrips,allTripsLength:allTrips?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
  // #endregion
  const companyDriverRevenue = allTrips?.filter(trip => {
    const driver = drivers?.find(d => d.id === trip.driver_id)
    // #region agent log
    appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/dashboard/page.tsx:64',message:'Driver lookup in filter',data:{tripId:trip?.id,driverId:trip?.driver_id,driverFound:!!driver,driverType:driver?.driver_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n').catch(()=>{});
    // #endregion
    return driver?.driver_type === 'company_driver'
  }).reduce((sum, trip) => sum + (trip.total_invoice || 0), 0) || 0

  const ownerOperatorRevenue = allTrips?.filter(trip => {
    const driver = drivers?.find(d => d.id === trip.driver_id)
    return driver?.driver_type === 'owner_operator'
  }).reduce((sum, trip) => sum + (trip.total_invoice || 0), 0) || 0

  const revenueBreakdown = [
    { category: 'Owner Operators', value: ownerOperatorRevenue, color: '#3b82f6' },
    { category: 'Company Drivers', value: companyDriverRevenue, color: '#8b5cf6' },
    { category: 'Company Earnings', value: totalEarnings, color: '#10b981' },
    { category: 'Driver Payments', value: driverEarnings, color: '#ec4899' },
  ]

  const dashboardData = {
    totalDrivers,
    totalTrips,
    totalRevenue,
    totalEarnings,
    driverEarnings,
    monthlyData,
    revenueBreakdown,
    allTrips: allTrips || [],
    drivers: drivers || [],
  }

  return <EnhancedDashboard data={dashboardData} />
}
