let socket = null
let clientScriptPromise = null

function loadSocketClient() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Socket.IO is available only in the browser'))
  if (window.io) return Promise.resolve(window.io)
  if (clientScriptPromise) return clientScriptPromise
  clientScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.VITE_SOCKET_URL || ''}/socket.io/socket.io.js`
    script.async = true
    script.onload = () => window.io ? resolve(window.io) : reject(new Error('Socket.IO client did not initialize'))
    script.onerror = () => { clientScriptPromise = null; reject(new Error('Unable to load Socket.IO client')) }
    document.head.appendChild(script)
  })
  return clientScriptPromise
}

export async function connectRealtime(token, handlers = {}) {
  if (!token) return null
  if (socket?.connected) return socket
  const io = await loadSocketClient()
  if (socket) socket.disconnect()
  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 8,
    timeout: 10000,
  })
  socket.on('message:new', (payload) => handlers.onNewMessage?.(payload))
  socket.on('message:sent', (payload) => handlers.onSentMessage?.(payload))
  socket.on('message:deleted', (payload) => handlers.onDeletedMessage?.(payload))
  socket.on('connect_error', (error) => handlers.onError?.(error))
  return socket
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}
