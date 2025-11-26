'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function EditDriverPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [driver, setDriver] = useState({
    name: '',
    driver_type: 'company_driver',
    email: '',
    phone: '',
    license_number: '',
    status: 'active',
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchDriver() {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        alert('Failed to load driver')
        router.push('/drivers')
      } else {
        setDriver({
          name: data.name,
          driver_type: data.driver_type,
          email: data.email || '',
          phone: data.phone || '',
          license_number: data.license_number || '',
          status: data.status,
        })
      }
      setLoading(false)
    }

    fetchDriver()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          name: driver.name,
          driver_type: driver.driver_type,
          email: driver.email || null,
          phone: driver.phone || null,
          license_number: driver.license_number || null,
          status: driver.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating driver:', error)
        alert('Failed to update driver. Please try again.')
      } else {
        router.push(`/drivers/${id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while updating the driver.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/drivers/${id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Driver Profile
      </Link>

      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Driver</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={driver.name}
                onChange={(e) => setDriver({ ...driver, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>

            {/* Driver Type */}
            <div>
              <label htmlFor="driver_type" className="block text-sm font-medium text-foreground mb-2">
                Driver Type *
              </label>
              <select
                id="driver_type"
                required
                value={driver.driver_type}
                onChange={(e) => setDriver({ ...driver, driver_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="company_driver">Company Driver (32%)</option>
                <option value="owner_operator">Owner Operator (100% after 10% dispatch fee)</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={driver.email}
                onChange={(e) => setDriver({ ...driver, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={driver.phone}
                onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>

            {/* License Number */}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-foreground mb-2">
                License Number
              </label>
              <input
                type="text"
                id="license_number"
                value={driver.license_number}
                onChange={(e) => setDriver({ ...driver, license_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Status *
              </label>
              <select
                id="status"
                required
                value={driver.status}
                onChange={(e) => setDriver({ ...driver, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Link
              href={`/drivers/${id}`}
              className="px-6 py-2 border text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
