import { AxiosError } from 'axios'
import { http } from '@/services/http'

/** Replaces the network layer. handler(config) returns { status, data } or throws an AxiosError-like failure. */
export function mockApi(handler) {
  const calls = []
  http.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data ? JSON.parse(config.data) : undefined })
    const result = await handler(config)
    if (result.status >= 400) {
      throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, {}, { status: result.status, data: result.data, headers: {}, config })
    }
    return { status: result.status, data: result.data, headers: {}, config, statusText: 'OK' }
  }
  return calls
}
export const networkDown = () => { throw new AxiosError('Network Error', 'ERR_NETWORK') }
export const timeout = () => { throw new AxiosError('timeout of 20000ms exceeded', 'ECONNABORTED') }
export const apiError = (status, code, message = 'x') => ({ status, data: { statusCode: status, code, message } })
