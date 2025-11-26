import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Account Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border rounded-md bg-muted text-muted-foreground"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              User ID
            </label>
            <input
              type="text"
              value={user?.id || ''}
              disabled
              className="w-full px-4 py-2 border rounded-md bg-muted text-muted-foreground font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Account Created
            </label>
            <input
              type="text"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
              disabled
              className="w-full px-4 py-2 border rounded-md bg-muted text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Speedy Carriers Management System</strong>
          </p>
          <p>Version 2.0.0</p>
          <p>
            Professional driver payment and trip management system for freight carriers.
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-400 mb-2">
          Need to reset your password?
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
          Log out and use the &quot;Forgot password?&quot; link on the login page to reset your password.
        </p>
      </div>
    </div>
  )
}
