import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'nona-taskboard-awj0hs1p',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_zJjqhuskN3trslHuLg6rOeCedb27nIeE',
  authRequired: false,
  auth: { mode: 'managed' },
})
