import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// We use the Gateway URL
export const AXIOS_INSTANCE = axios.create({
  baseURL: 'http://localhost:8080',
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mutator for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise as Promise<T>;
};
