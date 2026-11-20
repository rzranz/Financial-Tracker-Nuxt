import WebSocket from 'ws'

export default defineNitroPlugin(() => {
  // @supabase/supabase-js >=2.100 initializes RealtimeClient on createClient(),
  // which requires globalThis.WebSocket when running under Node 20.
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket
  }
})
