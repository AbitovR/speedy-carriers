import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DriversPage() {
  const supabase = await createClient()

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*, trips(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage your driver profiles</p>
        </div>
        <Link
          href="/drivers/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Driver
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers && drivers.length > 0 ? (
          drivers.map((driver) => (
            <Link
              key={driver.id}
              href={`/drivers/${driver.id}`}
              className="bg-card text-card-foreground rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-border hover:border-primary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    driver.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {driver.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-card-foreground mb-2">{driver.name}</h3>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Type:</span>{' '}
                  {driver.driver_type === 'company_driver' ? 'Company Driver (32%)' : 'Owner Operator (100% after 10% dispatch fee)'}
                </p>

                {driver.email && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Email:</span> {driver.email}
                  </p>
                )}

                {driver.phone && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Phone:</span> {driver.phone}
                  </p>
                )}

                {driver.license_number && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">License:</span> {driver.license_number}
                  </p>
                )}

                <p className="text-muted-foreground text-xs mt-3">
                  Added {formatDate(driver.created_at)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-card text-card-foreground rounded-lg shadow p-12 text-center border border-border">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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
  )
}
