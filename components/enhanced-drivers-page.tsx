'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, User, TrendingUp, DollarSign, FileText, Award, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Driver {
  id: string
  name: string
  email?: string
  phone?: string
  license_number?: string
  driver_type: 'company_driver' | 'owner_operator'
  status: 'active' | 'inactive'
  created_at: string
  trips?: Array<{
    id: string
    trip_date: string
    total_invoice: number
    driver_earnings: number
    company_earnings: number
    total_loads: number
  }>
}

interface EnhancedDriversPageProps {
  drivers: Driver[]
  allTrips: Array<{
    id: string
    driver_id: string
    trip_date: string
    total_invoice: number
    driver_earnings: number
    company_earnings: number
    total_loads: number
  }>
}

export default function EnhancedDriversPage({ drivers, allTrips }: EnhancedDriversPageProps) {
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Filter trips based on selected time frame
  const filteredTrips = useMemo(() => {
    if (timeFrame === 'all') return allTrips

    const now = new Date()
    const cutoffDate = new Date()
    
    if (timeFrame === '7d') {
      cutoffDate.setDate(now.getDate() - 7)
    } else if (timeFrame === '30d') {
      cutoffDate.setDate(now.getDate() - 30)
    } else if (timeFrame === '90d') {
      cutoffDate.setDate(now.getDate() - 90)
    }
    
    return allTrips.filter(trip => {
      const tripDate = new Date(trip.trip_date)
      return tripDate >= cutoffDate && tripDate <= now
    })
  }, [allTrips, timeFrame])

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalTrips = filteredTrips.length
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
    const totalDriverEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
    const totalCompanyEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)
    const totalLoads = filteredTrips.reduce((sum, trip) => sum + (trip.total_loads || 0), 0)

    return {
      totalTrips,
      totalRevenue,
      totalDriverEarnings,
      totalCompanyEarnings,
      totalLoads,
    }
  }, [filteredTrips])

  // Calculate driver performance
  const driverPerformance = useMemo(() => {
    const driverMap = new Map<string, {
      driver: Driver
      trips: number
      revenue: number
      driverEarnings: number
      companyEarnings: number
      loads: number
    }>()

    filteredTrips.forEach(trip => {
      const driver = drivers.find(d => d.id === trip.driver_id)
      if (!driver) return

      const existing = driverMap.get(driver.id) || {
        driver,
        trips: 0,
        revenue: 0,
        driverEarnings: 0,
        companyEarnings: 0,
        loads: 0,
      }

      existing.trips += 1
      existing.revenue += trip.total_invoice || 0
      existing.driverEarnings += trip.driver_earnings || 0
      existing.companyEarnings += trip.company_earnings || 0
      existing.loads += trip.total_loads || 0

      driverMap.set(driver.id, existing)
    })

    return Array.from(driverMap.values())
      .sort((a, b) => b.revenue - a.revenue)
  }, [filteredTrips, drivers])

  // Top performers
  const topDriver = driverPerformance[0]
  const topRevenue = driverPerformance.length > 0 ? driverPerformance[0].revenue : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage drivers and view performance analytics</p>
        </div>
        <Link
          href="/drivers/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Driver
        </Link>
      </div>

      {/* Analytics Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Performance Analytics</h2>
            <p className="text-sm text-muted-foreground">Driver performance metrics and insights</p>
          </div>
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === period
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Trips</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.totalTrips}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(overallStats.totalRevenue)}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Driver Earnings</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(overallStats.totalDriverEarnings)}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Company Earnings</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(overallStats.totalCompanyEarnings)}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Loads</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.totalLoads}</p>
          </div>
        </div>

        {/* Top Performers */}
        {topDriver && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-foreground">Top Driver by Revenue</h3>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">{topDriver.driver.name}</p>
                <p className="text-sm text-muted-foreground">
                  {topDriver.driver.driver_type === 'company_driver' ? 'Company Driver' : 'Owner Operator'}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(topDriver.revenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {topDriver.trips} trips • {topDriver.loads} loads
                </p>
              </div>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Top Gross Revenue</h3>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">{formatCurrency(topRevenue)}</p>
                <p className="text-sm text-muted-foreground">
                  Generated by {topDriver.driver.name}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeFrame === 'all' ? 'All time' : `Last ${timeFrame === '7d' ? '7 days' : timeFrame === '30d' ? '30 days' : '90 days'}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drivers Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">All Drivers</h2>
        </div>
        <div className="overflow-x-auto">
          {drivers && drivers.length > 0 ? (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trips
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {drivers.map((driver) => {
                  const performance = driverPerformance.find(p => p.driver.id === driver.id)
                  return (
                    <tr key={driver.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/drivers/${driver.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="bg-primary/10 rounded-full p-2">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {driver.name}
                            </p>
                            {driver.license_number && (
                              <p className="text-xs text-muted-foreground">License: {driver.license_number}</p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {driver.driver_type === 'company_driver' ? 'Company Driver' : 'Owner Operator'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            driver.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground font-medium">
                          {performance?.trips || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground font-medium">
                          {formatCurrency(performance?.revenue || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-green-600 font-medium">
                          {formatCurrency(performance?.driverEarnings || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {driver.email && <p className="truncate max-w-[150px]">{driver.email}</p>}
                          {driver.phone && <p>{driver.phone}</p>}
                          {!driver.email && !driver.phone && <p className="text-muted-foreground">—</p>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No drivers yet</h3>
              <p className="text-muted-foreground mb-6">Get started by adding your first driver</p>
              <Link
                href="/drivers/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Driver
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

