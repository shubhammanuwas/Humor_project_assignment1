import { createSupabaseServerClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function ProtectedPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Protected Page
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        You are signed in as {user?.email ?? 'Unknown user'}.
      </p>
      <SignOutButton />
    </main>
  )
}
