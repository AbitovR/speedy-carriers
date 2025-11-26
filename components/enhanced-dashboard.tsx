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
import { useState } from 'react'

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

export default function EnhancedDashboard({ data }: { data: DashboardData }) {
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d' | '90d'>('30d')

  const metrics = [
    {
      title: 'Active Drivers',
      value: data.totalDrivers,
      icon: Users,
      delay: 0,
    },
    {
      title: 'Total Trips',
      value: data.totalTrips,
      icon: FileText,
      delay: 0.1,
    },
    {
      title: 'Total Revenue',
      value: data.totalRevenue,
      change: 12.5,
      icon: DollarSign,
      prefix: '$',
      delay: 0.2,
    },
    {
      title: 'Company Earnings',
      value: data.totalEarnings,
      change: 8.3,
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
            Track your company's performance and key metrics
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
                Last 12 Months
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.monthlyData}>
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
          <div className="space-y-4">
            {data.revenueBreakdown.map((item, index) => {
              const total = data.revenueBreakdown.reduce((sum, i) => sum + i.value, 0)
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      ${(item.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {percentage}% of total revenue
                  </span>
                </div>
              )
            })}
          </div>
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
            <LineChart data={data.monthlyData}>
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
            <BarChart data={data.monthlyData.slice(0, 6)}>
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
