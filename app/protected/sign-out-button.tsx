'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      style={{
        padding: '0.75rem 1.25rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        background: isLoading ? '#f2f2f2' : '#fff',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '1rem',
      }}
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
