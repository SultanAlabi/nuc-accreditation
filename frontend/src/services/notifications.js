// Minimal WebSocket client for notifications (browser side)
export function createNotificationsSocket({ token, onMessage }) {
  // For development we assume same-host and ws protocol
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host
  let url = `${protocol}://${host}/ws/notifications/`
  if (token) {
    // attach token as query string param
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}token=${encodeURIComponent(token)}`
  }
  const ws = new WebSocket(url)

  ws.onopen = () => {
    // Optionally send auth token if your ASGI stack supports it.
    // With Django Channels + session auth, this may not be necessary.
    console.log('Notifications socket open')
  }

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      onMessage && onMessage(data)
    } catch (e) {
      console.error('Invalid notification message', e)
    }
  }

  ws.onclose = () => console.log('Notifications socket closed')
  ws.onerror = (e) => console.error('Notifications socket error', e)

  return ws
}
