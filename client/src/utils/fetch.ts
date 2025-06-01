import { accessTokenAtom, store } from "@/state/store";
import { createFetchWrapper, FetchResponse, RequestConfig } from "./fetchwrapper"
import { serverUrl } from "./constants";


export const api = createFetchWrapper({
  baseURL: serverUrl,
  credentials: 'include',
});


export const authApi = (token: string, opts?: any) => createFetchWrapper({
  baseURL: serverUrl,
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  },
  ...opts,
});

export const refreshToken = async (): Promise<string> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await api.get('/auth/refresh');

      if (response.status === 401) break; // refresh token is probably broken, stop trying and logout

      if (!response?.data?.accessToken) {
        throw new Error('Failed to refresh access token');
      }

      return response.data.accessToken;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
    }
  }

  throw new Error('Failed to refresh access token after 3 attempts');
}

export const logout = async (): Promise<void> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await api.get('/auth/logout');

      if (response.status !== 200) {
        throw new Error('Failed to logout');
      }

      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
    }
  }

  throw new Error('Failed to logout after 3 attempts');
}

export const AuthApi = {
  get: async <T>(token: string, url: string, config?: RequestConfig): Promise<FetchResponse<T>> => {
    const api = authApi(token);
    const response: FetchResponse<T> = await api.get(url, config);
    if (!response.data) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    if (response.status === 401) {
      const accessToken = await refreshToken();
      store.set(accessTokenAtom, accessToken);
      const retryResponse: FetchResponse<T> = await api.get(url, config);
      if (!retryResponse.data) {
        throw new Error(`Failed to fetch data from ${url} after token refresh`);
      }

      return retryResponse;
    }

    return response;
  },
  post: async <T>(token: string, url: string, body: any, config?: RequestConfig): Promise<FetchResponse<T>> => {
    const api = authApi(token);
    const response: FetchResponse<T> = await api.post(url, body, config);
    if (!response.data) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    if (response.status === 401) {
      const accessToken = await refreshToken();
      store.set(accessTokenAtom, accessToken);
      const retryResponse: FetchResponse<T> = await api.post(url, body, config);
      if (!retryResponse.data) {
        throw new Error(`Failed to fetch data from ${url} after token refresh`);
      }

      return retryResponse;
    }

    return response;
  },
  delete: async <T>(token: string, url: string, config?: RequestConfig): Promise<FetchResponse<T>> => {
    const api = authApi(token);
    const response: FetchResponse<T> = await api.delete(url, config);
    if (!response.data) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    if (response.status === 401) {
      const accessToken = await refreshToken();
      store.set(accessTokenAtom, accessToken);
      const retryResponse: FetchResponse<T> = await api.delete(url, config);
      if (!retryResponse.data) {
        throw new Error(`Failed to fetch data from ${url} after token refresh`);
      }

      return retryResponse;
    }

    return response;
  },
  put: async <T>(token: string, url: string, body: any, config?: RequestConfig): Promise<FetchResponse<T>> => {
    const api = authApi(token);
    const response: FetchResponse<T> = await api.put(url, body, config);
    if (!response.data) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    if (response.status === 401) {
      const accessToken = await refreshToken();
      store.set(accessTokenAtom, accessToken);
      const retryResponse: FetchResponse<T> = await api.put(url, body, config);
      if (!retryResponse.data) {
        throw new Error(`Failed to fetch data from ${url} after token refresh`);
      }

      return retryResponse;
    }

    return response;
  },
  patch: async <T>(token: string, url: string, body: any, config?: RequestConfig): Promise<FetchResponse<T>> => {
    const api = authApi(token);
    const response: FetchResponse<T> = await api.patch(url, body, config);
    if (!response.data) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    if (response.status === 401) {
      const accessToken = await refreshToken();
      store.set(accessTokenAtom, accessToken);
      const retryResponse: FetchResponse<T> = await api.patch(url, body, config);
      if (!retryResponse.data) {
        throw new Error(`Failed to fetch data from ${url} after token refresh`);
      }

      return retryResponse;
    }

    return response;
  },
};


