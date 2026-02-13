import LoginButtons from './login-buttons'

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sign in</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        This page uses Google OAuth and redirects to /auth/callback.
      </p>
      <LoginButtons />
    </main>
  )
}
