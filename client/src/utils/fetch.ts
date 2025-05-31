import { createFetchWrapper } from "./fetchwrapper"

const serverUrl = "http://localhost:8000"

export const authApi = (token: string, opts?: any) => createFetchWrapper({
  baseURL: serverUrl,
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  },
  ...opts,
});


export const api = createFetchWrapper({
  baseURL: serverUrl,
  credentials: 'include',
});


