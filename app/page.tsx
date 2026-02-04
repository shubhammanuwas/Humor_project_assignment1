import { supabase } from '@/lib/supabase'

type ShareRow = {
  profile_id: string | null
  share_to_destination_id: string | null
}

async function getShares(): Promise<ShareRow[]> {
  const { data, error } = await supabase
    .from('shares')
    .select('profile_id, share_to_destination_id')

  if (error) {
    console.error('Supabase error:', error.message)
    return []
  }

  return data ?? []
}

export default async function Home() {
  const shares = await getShares()

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
        Supabase Shares
      </h1>

      {shares.length === 0 ? (
        <p>No rows found.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            maxWidth: '720px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  padding: '0.5rem 0',
                }}
              >
                profile_id
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  padding: '0.5rem 0',
                }}
              >
                share_to_destination_id
              </th>
            </tr>
          </thead>
          <tbody>
            {shares.map((row, idx) => (
              <tr key={`${row.profile_id ?? 'null'}-${idx}`}>
                <td style={{ padding: '0.5rem 0' }}>
                  {row.profile_id ?? 'null'}
                </td>
                <td style={{ padding: '0.5rem 0' }}>
                  {row.share_to_destination_id ?? 'null'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
