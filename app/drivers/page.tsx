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
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage your driver profiles</p>
        </div>
        <Link
          href="/drivers/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    driver.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {driver.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{driver.name}</h3>

              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Type:</span>{' '}
                  {driver.driver_type === 'company_driver' ? 'Company Driver (32%)' : 'Owner Operator (90%)'}
                </p>

                {driver.email && (
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {driver.email}
                  </p>
                )}

                {driver.phone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Phone:</span> {driver.phone}
                  </p>
                )}

                {driver.license_number && (
                  <p className="text-gray-600">
                    <span className="font-medium">License:</span> {driver.license_number}
                  </p>
                )}

                <p className="text-gray-500 text-xs mt-3">
                  Added {formatDate(driver.created_at)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No drivers yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first driver</p>
            <Link
              href="/drivers/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
