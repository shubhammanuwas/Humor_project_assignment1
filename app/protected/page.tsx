import { createSupabaseServerClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'
import { revalidatePath } from 'next/cache'
import CaptionPipeline from './caption-pipeline'

type CaptionRow = {
  [key: string]: string | number | boolean | null
}

type VoteDirection = 'up' | 'down'

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>

function getCaptionId(row: CaptionRow): string {
  const rawId = row.id ?? row.caption_id
  if (rawId === null || rawId === undefined) {
    return ''
  }
  return String(rawId)
}

function getCaptionText(row: CaptionRow): string {
  const textCandidates = [
    row.caption,
    row.text,
    row.content,
    row.body,
    row.caption_text,
  ]

  for (const value of textCandidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return JSON.stringify(row)
}

async function resolveProfileId(
  supabase: SupabaseClient,
  authUserId: string
): Promise<string> {
  const byUserId = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authUserId)
    .limit(1)
    .maybeSingle()

  if (!byUserId.error && byUserId.data?.id) {
    return String(byUserId.data.id)
  }

  const byAuthUserId = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .limit(1)
    .maybeSingle()

  if (!byAuthUserId.error && byAuthUserId.data?.id) {
    return String(byAuthUserId.data.id)
  }

  return authUserId
}

async function insertVote(
  supabase: SupabaseClient,
  captionId: string,
  profileId: string,
  direction: VoteDirection
): Promise<{ success: boolean; errorMessage?: string }> {
  const now = new Date().toISOString()
  const payloads: Array<Record<string, string | number>> = [
    {
      caption_id: captionId,
      profile_id: profileId,
      vote_value: direction === 'up' ? 1 : -1,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    },
    {
      caption_id: captionId,
      profile_id: profileId,
      vote_value: direction === 'up' ? 1 : -1,
    },
    {
      caption_id: captionId,
      profile_id: profileId,
      vote_value: direction === 'up' ? 'up' : 'down',
      created_datetime_utc: now,
      modified_datetime_utc: now,
    },
    {
      caption_id: captionId,
      profile_id: profileId,
      vote_value: direction === 'up' ? 'up' : 'down',
    },
  ]

  for (const payload of payloads) {
    const { error } = await supabase.from('caption_votes').insert(payload)
    if (!error) {
      return { success: true }
    }
  }

  const { error } = await supabase.from('caption_votes').insert({
    caption_id: captionId,
    profile_id: profileId,
    vote_value: direction === 'up' ? 1 : -1,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  })

  return {
    success: false,
    errorMessage: error?.message ?? 'Unknown insert error',
  }
}

async function voteCaption(formData: FormData) {
  'use server'

  const captionId = String(formData.get('caption_id') ?? '')
  const direction = String(formData.get('direction') ?? '') as VoteDirection

  if (!captionId || (direction !== 'up' && direction !== 'down')) {
    return
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const profileId = await resolveProfileId(supabase, user.id)
  const result = await insertVote(supabase, captionId, profileId, direction)
  if (!result.success) {
    console.error('Vote insert error:', result.errorMessage)
    return
  }

  revalidatePath('/protected')
}

async function getCaptions() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from('captions').select('*').limit(25)

  if (error) {
    console.error('Captions fetch error:', error.message)
    return []
  }

  return (data ?? []) as CaptionRow[]
}

export default async function ProtectedPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const captions = await getCaptions()

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
      <p style={{ marginBottom: '1.25rem' }}>
        Rate captions below. Each vote creates a new row in caption_votes.
      </p>
      <SignOutButton />
      <CaptionPipeline />

      <section style={{ marginTop: '2rem', maxWidth: '760px' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Captions</h2>
        {captions.length === 0 ? (
          <p>No captions found (or access is blocked by RLS).</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {captions.map((caption, idx) => {
              const captionId = getCaptionId(caption)
              const captionText = getCaptionText(caption)
              const disabled = captionId.length === 0

              return (
                <li
                  key={`${captionId || 'missing-id'}-${idx}`}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0, marginBottom: '0.65rem' }}>{captionText}</p>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <form action={voteCaption}>
                      <input type="hidden" name="caption_id" value={captionId} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={disabled}
                        style={{
                          padding: '0.45rem 0.8rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Upvote
                      </button>
                    </form>
                    <form action={voteCaption}>
                      <input type="hidden" name="caption_id" value={captionId} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={disabled}
                        style={{
                          padding: '0.45rem 0.8rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Downvote
                      </button>
                    </form>
                  </div>
                  {disabled ? (
                    <p style={{ margin: '0.55rem 0 0 0', color: '#a00', fontSize: '0.9rem' }}>
                      Missing caption id column (expected id or caption_id).
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
