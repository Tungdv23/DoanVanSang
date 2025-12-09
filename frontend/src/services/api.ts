const API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env.VITE_API_BASE_URL as string | undefined)) ||
  '';

export const buildApiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

export const apiFetch = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error('API error');
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
};
