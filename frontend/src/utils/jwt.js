// Reads only the public "exp" claim so the UI can drop an expired session early.
// The signature is NOT verified here – the backend remains the authority.
export function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(decodeURIComponent(escape(atob(payload))))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}
export function isTokenExpired(token) {
  const exp = getTokenExpiry(token)
  return exp !== null && exp <= Date.now()
}
