import { createClient } from '@/lib/supabase/server'
import EnhancedDriversPage from '@/components/enhanced-drivers-page'

export default async function DriversPage() {
  const supabase = await createClient()

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: allTrips } = await supabase
    .from('trips')
    .select('id, driver_id, trip_date, total_invoice, driver_earnings, company_earnings, total_loads')
    .order('trip_date', { ascending: false })

  return <EnhancedDriversPage drivers={drivers || []} allTrips={allTrips || []} />
}
