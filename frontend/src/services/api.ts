const API_BASE_RAW =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env.VITE_API_BASE_URL as string | undefined)) ||
  '';

// Ghép base + path, tránh trùng // khi base đã có '/' và path cũng bắt đầu bằng '/'
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const API_BASE = API_BASE_RAW ? trimTrailingSlash(API_BASE_RAW) : '';

export const buildApiUrl = (path: string) => {
  if (!API_BASE) return path;
  const normalizedPath = trimLeadingSlash(path);
  return `${API_BASE}/${normalizedPath}`;
};

export const apiFetch = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    let detail = '';
    try {
      const text = await response.text();
      detail = text ? `: ${text}` : '';
    } catch {
      // ignore parse errors
    }
    throw new Error(`API error (${response.status} ${response.statusText})${detail}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
};
