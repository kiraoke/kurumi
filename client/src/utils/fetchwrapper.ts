export type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface FetchWrapperConfig {
  baseURL?: string
  headers?: Record<string, string>
  credentials?: RequestCredentials
}

export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number>
  body?: any
}

export interface FetchResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export function createFetchWrapper(config: FetchWrapperConfig = {}) {
  const baseURL = config.baseURL || ''
  const defaultHeaders = config.headers || {}

  const request = async <T = any>(
    method: FetchMethod,
    url: string,
    { headers = {}, params, body }: RequestConfig = {}
  ): Promise<FetchResponse<T>> => {
    let fullUrl = baseURL + url

    // Append query params if any
    if (params) {
      const query = new URLSearchParams(params as any).toString()
      fullUrl += `?${query}`
    }

    const res = await fetch(fullUrl, {
      method,
      credentials: config.credentials || 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const contentType = res.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await res.json() : await res.text()

    return {
      data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    }
  }

  return {
    get: <T = any>(url: string, config?: RequestConfig) =>
      request<T>('GET', url, config),
    post: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>('POST', url, { ...config, body }),
    put: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>('PUT', url, { ...config, body }),
    delete: <T = any>(url: string, config?: RequestConfig) =>
      request<T>('DELETE', url, config),
    patch: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>('PATCH', url, { ...config, body }),
  }
}

