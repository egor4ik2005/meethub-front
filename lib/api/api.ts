import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Use the EXPO_PUBLIC_API_URL if defined, otherwise fallback to the computer's local IP
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.77:8080';

export const AXIOS_INSTANCE = axios.create({
  baseURL: BASE_URL,
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
