'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewDriverPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    driver_type: 'company_driver' as 'company_driver' | 'owner_operator',
    email: '',
    phone: '',
    license_number: '',
    status: 'active' as 'active' | 'inactive',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' })
      setLoading(false)
      return
    }

    const { error } = await (supabase as any).from('drivers').insert([
      {
        ...formData,
        user_id: user.id,
      },
    ])

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      setMessage({ type: 'success', text: 'Driver added successfully!' })
      setTimeout(() => {
        router.push('/drivers')
        router.refresh()
      }, 1000)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Drivers
      </Link>

      <div className="bg-card rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Add New Driver</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="driver_type" className="block text-sm font-medium text-foreground mb-2">
              Driver Type *
            </label>
            <select
              id="driver_type"
              required
              value={formData.driver_type}
              onChange={(e) =>
                setFormData({ ...formData, driver_type: e.target.value as 'company_driver' | 'owner_operator' })
              }
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="company_driver">Company Driver (32%)</option>
              <option value="owner_operator">Owner Operator (100% after 10% dispatch fee)</option>
            </select>
            <p className="mt-2 text-sm text-muted-foreground">
              {formData.driver_type === 'company_driver'
                ? 'Company driver receives 32% of gross revenue before expenses'
                : 'Owner operator receives 100% of net revenue after 10% dispatch fee and expenses'}
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="driver@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="license_number" className="block text-sm font-medium text-foreground mb-2">
              License Number
            </label>
            <input
              id="license_number"
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="CDL-123456"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
              Status *
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Driver'}
            </button>
            <Link
              href="/drivers"
              className="flex-1 bg-secondary text-foreground py-2 px-4 rounded-md hover:bg-secondary/80 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
