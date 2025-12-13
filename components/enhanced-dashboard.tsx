'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Truck,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useState, useMemo } from 'react'
import { DonutChart, type DonutChartSegment } from '@/components/ui/donut-chart'
import { AnimatePresence } from 'framer-motion'
import { formatCurrency, cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: React.ElementType
  prefix?: string
  suffix?: string
  delay?: number
}

interface ChartDataPoint {
  name: string
  revenue: number
  expenses: number
  earnings: number
}

interface Trip {
  id: string
  driver_id: string
  trip_date: string
  total_invoice: number
  company_earnings: number
  driver_earnings: number
}

interface Driver {
  id: string
  driver_type: string
}

interface DashboardData {
  totalDrivers: number
  totalTrips: number
  totalRevenue: number
  totalEarnings: number
  driverEarnings: number
  monthlyData: ChartDataPoint[]
  revenueBreakdown: Array<{
    category: string
    value: number
    color: string
  }>
  allTrips: Trip[]
  drivers: Driver[]
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  prefix = '',
  suffix = '',
  delay = 0,
}) => {
  const isPositive = change !== undefined && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              isPositive
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="text-3xl font-bold text-foreground">
        {prefix}
        <CountUp end={value} duration={2.5} separator="," decimals={prefix === '$' ? 2 : 0} />
        {suffix}
      </div>
    </motion.div>
  )
}

function RevenueBreakdownDonut({ revenueBreakdown }: { revenueBreakdown: Array<{ category: string; value: number; color: string }> }) {
  const [hoveredSegment, setHoveredSegment] = useState<DonutChartSegment | null>(null)

  // Convert revenue breakdown to donut chart segments
  const donutData: DonutChartSegment[] = revenueBreakdown.map((item) => ({
    value: item.value,
    color: item.color,
    label: item.category,
  }))

  const totalValue = donutData.reduce((sum, d) => sum + d.value, 0)
  const activeSegment = hoveredSegment || null
  const displayValue = activeSegment?.value ?? totalValue
  const displayLabel = activeSegment?.label ?? 'Total Revenue'
  const displayPercentage = activeSegment
    ? ((activeSegment.value / totalValue) * 100)
    : 100

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      {/* Donut Chart */}
      <div className="flex-shrink-0">
        <DonutChart
          data={donutData}
          size={250}
          strokeWidth={30}
          animationDuration={1.2}
          animationDelayPerSegment={0.05}
          highlightOnHover={true}
          onSegmentHover={setHoveredSegment}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="flex flex-col items-center justify-center text-center"
              >
                <p className="text-muted-foreground text-sm font-medium truncate max-w-[150px]">
                  {displayLabel}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(displayValue)}
                </p>
                {activeSegment && (
                  <p className="text-lg font-medium text-muted-foreground">
                    [{displayPercentage.toFixed(1)}%]
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      {/* Legend */}
      <div className="flex flex-col space-y-3 w-full md:w-auto min-w-[200px]">
        {revenueBreakdown.map((item, index) => {
          const total = revenueBreakdown.reduce((sum, i) => sum + i.value, 0)
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
          const isHovered = hoveredSegment?.label === item.category

          return (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-md transition-all duration-200 cursor-pointer",
                isHovered && "bg-muted"
              )}
              onMouseEnter={() => {
                const segment = donutData.find(d => d.label === item.category)
                if (segment) setHoveredSegment(segment)
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center space-x-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {item.category}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground block">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {percentage}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default function EnhancedDashboard({ data }: { data: DashboardData }) {
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d' | '90d'>('30d')

  // Filter trips based on selected time frame
  const filteredTrips = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()
    
    if (timeFrame === '7d') {
      cutoffDate.setDate(now.getDate() - 7)
    } else if (timeFrame === '30d') {
      cutoffDate.setDate(now.getDate() - 30)
    } else if (timeFrame === '90d') {
      cutoffDate.setDate(now.getDate() - 90)
    }
    
    return data.allTrips.filter(trip => {
      const tripDate = new Date(trip.trip_date)
      return tripDate >= cutoffDate && tripDate <= now
    })
  }, [data.allTrips, timeFrame])

  // Calculate filtered metrics
  const filteredMetrics = useMemo(() => {
    const totalTrips = filteredTrips.length
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
    const totalEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)
    const driverEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
    
    return {
      totalTrips,
      totalRevenue,
      totalEarnings,
      driverEarnings,
    }
  }, [filteredTrips])

  // Calculate chart data based on filtered trips
  const chartData = useMemo(() => {
    const now = new Date()
    const days = timeFrame === '7d' ? 7 : timeFrame === '30d' ? 30 : 90
    const dataPoints: ChartDataPoint[] = []
    
    // For 7 days, show daily data
    if (timeFrame === '7d') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayTrips = filteredTrips.filter(trip => {
          const tripDate = new Date(trip.trip_date)
          return tripDate >= dayStart && tripDate <= dayEnd
        })
        
        const revenue = dayTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
        const expenses = dayTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
        const earnings = dayTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)
        
        dataPoints.push({
          name: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue,
          expenses,
          earnings,
        })
      }
    } else {
      // For 30 and 90 days, show weekly data
      const weeks = timeFrame === '30d' ? 4 : 12
      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        const weekTrips = filteredTrips.filter(trip => {
          const tripDate = new Date(trip.trip_date)
          return tripDate >= weekStart && tripDate <= weekEnd
        })
        
        const revenue = weekTrips.reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)
        const expenses = weekTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)
        const earnings = weekTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)
        
        dataPoints.push({
          name: `Week ${weeks - i}`,
          revenue,
          expenses,
          earnings,
        })
      }
    }
    
    return dataPoints
  }, [filteredTrips, timeFrame])

  // Calculate revenue breakdown based on filtered trips
  const revenueBreakdown = useMemo(() => {
    const companyDriverRevenue = filteredTrips.filter(trip => {
      const driver = data.drivers.find(d => d.id === trip.driver_id)
      return driver?.driver_type === 'company_driver'
    }).reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)

    const ownerOperatorRevenue = filteredTrips.filter(trip => {
      const driver = data.drivers.find(d => d.id === trip.driver_id)
      return driver?.driver_type === 'owner_operator'
    }).reduce((sum, trip) => sum + (trip.total_invoice || 0), 0)

    const totalEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.company_earnings || 0), 0)
    const driverEarnings = filteredTrips.reduce((sum, trip) => sum + (trip.driver_earnings || 0), 0)

    return [
      { category: 'Owner Operators', value: ownerOperatorRevenue, color: '#3b82f6' },
      { category: 'Company Drivers', value: companyDriverRevenue, color: '#8b5cf6' },
      { category: 'Company Earnings', value: totalEarnings, color: '#10b981' },
      { category: 'Driver Payments', value: driverEarnings, color: '#ec4899' },
    ]
  }, [filteredTrips, data.drivers])

  const metrics = [
    {
      title: 'Active Drivers',
      value: data.totalDrivers,
      icon: Users,
      delay: 0,
    },
    {
      title: 'Total Trips',
      value: filteredMetrics.totalTrips,
      icon: FileText,
      delay: 0.1,
    },
    {
      title: 'Total Revenue',
      value: filteredMetrics.totalRevenue,
      icon: DollarSign,
      prefix: '$',
      delay: 0.2,
    },
    {
      title: 'Company Earnings',
      value: filteredMetrics.totalEarnings,
      icon: TrendingUp,
      prefix: '$',
      delay: 0.3,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your company&apos;s performance and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFrame(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFrame === period
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Revenue & Earnings Trend
              </h2>
              <p className="text-sm text-muted-foreground">
                Monthly financial overview
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {timeFrame === '7d' ? 'Last 7 Days' : timeFrame === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Total Revenue"
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEarnings)"
                name="Company Earnings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">
            Revenue Breakdown
          </h2>
          <RevenueBreakdownDonut revenueBreakdown={revenueBreakdown} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">
            Monthly Earnings Trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                name="Company Earnings"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">
            Revenue vs Expenses
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} name="Driver Pay" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
